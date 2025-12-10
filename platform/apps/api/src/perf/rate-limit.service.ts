import { Injectable } from "@nestjs/common";

type LimitResult = { allowed: true } | { allowed: false; reason: "ip" | "org" };

@Injectable()
export class RateLimitService {
  private readonly windowMs = Number(process.env.PERF_RATE_LIMIT_WINDOW_MS ?? 60_000);
  private readonly ipLimit = Number(process.env.PERF_RATE_LIMIT_IP ?? 120);
  private readonly orgLimit = Number(process.env.PERF_RATE_LIMIT_ORG ?? 240);

  private ipHits = new Map<string, number[]>();
  private orgHits = new Map<string, number[]>();

  shouldAllow(ip: string | null | undefined, orgId: string | null | undefined): LimitResult {
    const now = Date.now();
    if (ip) this.prune(ip, this.ipHits, now);
    if (orgId) this.prune(orgId, this.orgHits, now);

    if (ip && this.count(ip, this.ipHits) >= this.ipLimit) {
      return { allowed: false, reason: "ip" };
    }
    if (orgId && this.count(orgId, this.orgHits) >= this.orgLimit) {
      return { allowed: false, reason: "org" };
    }

    if (ip) this.push(ip, this.ipHits, now);
    if (orgId) this.push(orgId, this.orgHits, now);
    return { allowed: true };
  }

  private prune(key: string, bucket: Map<string, number[]>, now: number) {
    const cutoff = now - this.windowMs;
    const arr = bucket.get(key);
    if (!arr) return;
    const filtered = arr.filter((ts) => ts >= cutoff);
    if (filtered.length === 0) {
      bucket.delete(key);
    } else {
      bucket.set(key, filtered);
    }
  }

  private count(key: string, bucket: Map<string, number[]>) {
    return bucket.get(key)?.length ?? 0;
  }

  private push(key: string, bucket: Map<string, number[]>, ts: number) {
    const arr = bucket.get(key) ?? [];
    arr.push(ts);
    bucket.set(key, arr);
  }
}

