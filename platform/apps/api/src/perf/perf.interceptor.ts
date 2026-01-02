import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, catchError, tap } from "rxjs";
import { PerfService } from "./perf.service";
import { ObservabilityService } from "../observability/observability.service";
import { extractClientIpFromRequest } from "../common/ip-utils";

@Injectable()
export class PerfInterceptor implements NestInterceptor {
  constructor(
    private readonly perfService: PerfService,
    private readonly observability?: ObservabilityService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const anyReq = req as any;

    const start = Date.now();
    const route =
      `${req.method} ${anyReq.route?.path ?? anyReq.path ?? req.url ?? ""}`.trim() || "unknown";
    const headers = (anyReq.headers ?? {}) as Record<string, any>;
    const orgHeader = anyReq.organizationId ?? headers["x-organization-id"] ?? headers.get?.("x-organization-id");
    const orgId = Array.isArray(orgHeader) ? orgHeader[0] : orgHeader ?? null;
    // Extract and validate client IP to prevent spoofing via x-forwarded-for
    const ip = extractClientIpFromRequest(anyReq);

    const record = (statusCode: number) => {
      const durationMs = Date.now() - start;
      this.perfService.recordSample({
        durationMs,
        statusCode,
        route,
        orgId,
        ip,
      });
      this.observability?.recordApiRequest({
        method: req.method,
        path: route,
        status: statusCode,
        durationMs,
      });
    };

    return next.handle().pipe(
      tap(() => record((res as any).statusCode ?? 200)),
      catchError((err) => {
        const status = typeof err?.getStatus === "function" ? err.getStatus() : 500;
        record(status);
        throw err;
      })
    );
  }
}

