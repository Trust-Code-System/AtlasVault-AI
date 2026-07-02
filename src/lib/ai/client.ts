import Anthropic from "@anthropic-ai/sdk";

/**
 * Model router. When ANTHROPIC_API_KEY is present, tasks run on Claude.
 * Otherwise the app runs in "Local Knowledge Mode": deterministic,
 * extractive implementations in mock.ts keep the full workflow usable
 * offline (and honest — everything it outputs comes verbatim from sources).
 */

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function aiModelLabel(): string {
  return aiEnabled() ? (process.env.ATLASVAULT_MODEL ?? "claude-sonnet-5") : "Local Knowledge Mode (no API key)";
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function complete(system: string, prompt: string, maxTokens = 2000): Promise<string> {
  const model = process.env.ATLASVAULT_MODEL ?? "claude-sonnet-5";
  const res = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

/** Ask for strict JSON and parse defensively (strips code fences, finds outermost braces). */
export async function completeJson<T>(system: string, prompt: string, maxTokens = 3000): Promise<T | null> {
  try {
    const raw = await complete(system + "\nRespond ONLY with valid JSON. No prose, no code fences.", prompt, maxTokens);
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
