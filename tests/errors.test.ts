import { describe, expect, it } from "vitest";
import { sanitizeMessage } from "@/lib/errors";

describe("error redaction", () => {
  it("redacts secrets, tokens, emails, numbers, and content-like fields", () => {
    const sanitized = sanitizeMessage(
      "Failed for ada@example.com password=supersecret Bearer abc.def.ghi sk-testsecret123456 phone +234 812 345 6789 prompt: This is private proposal text that should never be logged"
    );

    expect(sanitized).not.toContain("ada@example.com");
    expect(sanitized).not.toContain("supersecret");
    expect(sanitized).not.toContain("abc.def.ghi");
    expect(sanitized).not.toContain("sk-testsecret123456");
    expect(sanitized).not.toContain("+234 812 345 6789");
    expect(sanitized).not.toContain("private proposal text");
    expect(sanitized).toContain("[EMAIL_REDACTED]");
    expect(sanitized).toContain("[CONTENT_REDACTED]");
  });
});
