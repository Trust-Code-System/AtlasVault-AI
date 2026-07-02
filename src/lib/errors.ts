import { NextResponse } from "next/server";
import { db } from "./db";

/**
 * Clean API error layer. Users never see stack traces or framework errors —
 * they get a calm message plus a reference ID. The admin portal receives a
 * sanitized ErrorLog (no document content, prompts, outputs or credentials).
 */

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/sk-[a-zA-Z0-9-_]{10,}/g, "[API_KEY_REDACTED]"],
  [/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [TOKEN_REDACTED]"],
  [/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, "[JWT_REDACTED]"],
  [/(password|passphrase|secret|api[_-]?key|token)['":\s=]+[^\s,;}]+/gi, "$1=[REDACTED]"],
  [/(prompt|document|content|proposal|answer|chat|fileText|extractedText)['":\s=]+["'`]?[\s\S]{24,}/gi, "$1=[CONTENT_REDACTED]"],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL_REDACTED]"],
  [/\+?\d[\d\s().-]{8,}\d/g, "[NUMBER_REDACTED]"],
];

export function sanitizeMessage(message: string): string {
  let out = message.slice(0, 400);
  for (const [pattern, replacement] of SECRET_PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

export function newErrorRef(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ERR-${new Date().getFullYear()}-${rand}`;
}

export async function logError(params: {
  error: unknown;
  route?: string;
  method?: string;
  statusCode?: number;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  category?: string;
  workspaceId?: string | null;
  userId?: string | null;
}): Promise<string> {
  const ref = newErrorRef();
  const err = params.error instanceof Error ? params.error : new Error(String(params.error));
  try {
    await db.errorLog.create({
      data: {
        ref,
        severity: params.severity ?? "ERROR",
        category: params.category ?? "UNHANDLED",
        message: sanitizeMessage(err.message || "Unknown error"),
        stack: err.stack ? sanitizeMessage(err.stack.slice(0, 2000)) : null,
        route: params.route,
        method: params.method,
        statusCode: params.statusCode ?? 500,
        workspaceId: params.workspaceId ?? null,
        userId: params.userId ?? null,
      },
    });
  } catch (e) {
    console.error("error logging failed", e);
  }
  console.error(`[${ref}]`, err);
  return ref;
}

type RouteHandler<T> = (req: Request, ctx: T) => Promise<Response>;

/** Wrap a route handler so unexpected failures return a branded, referenced error. */
export function withApi<T>(handler: RouteHandler<T>, category = "API"): RouteHandler<T> {
  return async (req: Request, ctx: T) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const url = (() => {
        try { return new URL(req.url).pathname; } catch { return undefined; }
      })();
      const ref = await logError({ error, route: url, method: req.method, category });
      return NextResponse.json(
        {
          error: `We couldn't complete this action right now. Please try again. If it continues, share this reference with support: ${ref}.`,
          ref,
        },
        { status: 500 }
      );
    }
  };
}
