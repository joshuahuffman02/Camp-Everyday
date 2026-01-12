// Generates a UUID with graceful fallbacks for browsers/environments that lack
// crypto.randomUUID (e.g., older Safari or polyfilled crypto in dev).
export function randomId(prefix?: string): string {
  if (typeof crypto !== "undefined") {
    if ("randomUUID" in crypto && typeof crypto.randomUUID === "function") {
      const id = crypto.randomUUID();
      return prefix ? `${prefix}-${id}` : id;
    }
    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Set version (4) and variant bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      return prefix ? `${prefix}-${id}` : id;
    }
  }

  const fallback = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${fallback}` : fallback;
}
