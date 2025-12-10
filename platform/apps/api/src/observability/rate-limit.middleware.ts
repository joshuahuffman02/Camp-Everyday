type Bucket = { count: number; resetAt: number };

export class RateLimitMiddleware {
  private readonly windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
  private readonly maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
  private readonly map = new Map<string, Bucket>();

  use = (req: any, res: any, next: any): void => {
    const now = Date.now();
    const keyHeader = req.headers["x-api-key"];
    const keyValue = typeof keyHeader === "string" ? keyHeader : Array.isArray(keyHeader) ? keyHeader[0] : undefined;
    const key = keyValue?.toString?.() || req.ip || "unknown";
    const existing = this.map.get(key);
    if (!existing || existing.resetAt < now) {
      this.map.set(key, { count: 1, resetAt: now + this.windowMs });
      return next();
    }

    if (existing.count >= this.maxRequests) {
      const retryAfter = Math.max(0, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({
        error: "rate_limited",
        message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
      });
    }

    existing.count += 1;
    return next();
  };
}

