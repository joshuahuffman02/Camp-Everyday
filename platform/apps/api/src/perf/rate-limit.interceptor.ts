import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { Observable } from "rxjs";
import { RateLimitService } from "./rate-limit.service";
import { PerfService } from "./perf.service";

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly perfService: PerfService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();

    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;
    const orgHeader = (req as any).organizationId ?? req.headers["x-organization-id"];
    const orgId = Array.isArray(orgHeader) ? orgHeader[0] : orgHeader ?? null;

    const result = this.rateLimitService.shouldAllow(ip, orgId);
    if (!result.allowed) {
      this.perfService.recordLimiterHit(result.reason);
      throw new HttpException("Too Many Requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    return next.handle();
  }
}

