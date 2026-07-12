const SENSITIVE_PATTERNS = [
  /\b\d{13,19}\b/,
  /\bcvv\b/i,
  /\bcvc\b/i,
  /\bcard\s*number\b/i,
  /\bpassword\b/i,
  /\bpin\b/i,
  /\bbank(ing)?\s*(password|pin|login)\b/i,
  /\bssn\b/i,
];

export function containsSensitiveContent(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export const SENSITIVE_MESSAGE_ERROR =
  "For your security, please do not share card numbers, passwords, or banking credentials in chat.";
