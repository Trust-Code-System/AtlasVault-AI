import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Model router. OpenAI is preferred when OPENAI_API_KEY is present. Anthropic
 * remains available via ANTHROPIC_API_KEY. Otherwise the app runs in
 * "Local Knowledge Mode": deterministic extractive implementations in mock.ts.
 */

type AiProvider = "openai" | "anthropic" | "local";

const DEFAULT_OPENAI_MODEL = "gpt-5.5";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

function requestedProvider(): "openai" | "anthropic" | "auto" {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "openai" || provider === "anthropic") return provider;
  return "auto";
}

function activeProvider(): AiProvider {
  const requested = requestedProvider();
  if (requested === "openai") return process.env.OPENAI_API_KEY ? "openai" : "local";
  if (requested === "anthropic") return process.env.ANTHROPIC_API_KEY ? "anthropic" : "local";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "local";
}

export function aiEnabled(): boolean {
  return activeProvider() !== "local";
}

export function aiModelLabel(): string {
  const provider = activeProvider();
  if (provider === "openai") return `OpenAI ${openAIModel()}`;
  if (provider === "anthropic") return `Claude ${anthropicModel()}`;
  return "Local Knowledge Mode (no API key)";
}

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function openAIModel() {
  return process.env.OPENAI_MODEL ?? process.env.ATLASVAULT_MODEL ?? DEFAULT_OPENAI_MODEL;
}

function anthropicModel() {
  return process.env.ANTHROPIC_MODEL ?? process.env.ATLASVAULT_MODEL ?? DEFAULT_ANTHROPIC_MODEL;
}

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

export async function complete(system: string, prompt: string, maxTokens = 2000): Promise<string> {
  const provider = activeProvider();

  if (provider === "openai") {
    const res = await getOpenAIClient().responses.create({
      model: openAIModel(),
      instructions: system,
      input: prompt,
      max_output_tokens: maxTokens,
    });
    return res.output_text ?? "";
  }

  if (provider === "anthropic") {
    const res = await getAnthropicClient().messages.create({
      model: anthropicModel(),
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  }

  return "";
}

/** Ask for strict JSON and parse defensively (strips code fences, finds outermost braces). */
export async function completeJson<T>(system: string, prompt: string, maxTokens = 3000): Promise<T | null> {
  try {
    const raw = await complete(`${system}\nRespond ONLY with valid JSON. No prose, no code fences.`, prompt, maxTokens);
    return parseJsonLoose<T>(raw);
  } catch (e) {
    console.error("AI JSON call failed", e);
    return null;
  }
}

export function parseJsonLoose<T>(raw: string): T | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.search(/[{[]/);
  if (start === -1) return null;
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
