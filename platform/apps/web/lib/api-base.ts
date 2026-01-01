/**
 * Resolves the API base URL for server-side requests.
 *
 * For SSR (server-side rendering), we need to use the full backend URL
 * since Next.js rewrites only work for client-side requests.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_BASE environment variable (if set)
 * 2. Production: Railway API backend URL
 * 3. Development: localhost:4000
 */
export function getServerApiBase(): string {
  // If explicitly set via env var, use that
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }

  // In production, use the Railway API backend
  if (process.env.NODE_ENV === "production") {
    return "https://camp-everydayapi-production.up.railway.app";
  }

  // In development, use localhost
  return "http://localhost:4000";
}
