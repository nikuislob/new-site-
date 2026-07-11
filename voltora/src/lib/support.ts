const SENSITIVE_PATTERNS = [
  /\b(?:cvv|cvc|cvv2|security\s*code)\b/i,
  /\b(?:card\s*number|credit\s*card|debit\s*card)\b/i,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  /\b(?:password|passwd|pwd|pin\s*code|otp|one[- ]time)\b/i,
  /\b(?:routing\s*number|account\s*number|ssn|social\s*security)\b/i,
];

export function containsSensitiveContent(text: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(text));
}

export const SENSITIVE_MESSAGE_ERROR =
  "For your security, please do not share passwords, card numbers, CVV codes, OTPs, or banking credentials in chat. Contact support through official channels if you need account help.";
