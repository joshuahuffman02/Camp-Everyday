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

type PerfRequest = Request & { organizationId?: string; route?: { path?: string } };

@Injectable()
export class PerfInterceptor implements NestInterceptor {
  constructor(
    private readonly perfService: PerfService,
    private readonly observability?: ObservabilityService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<PerfRequest>();
    const res = http.getResponse<Response>();

    const start = Date.now();
    const route =
      `${req.method} ${req.route?.path ?? req.path ?? req.url ?? ""}`.trim() || "unknown";
    const orgHeader = req.organizationId ?? req.headers["x-organization-id"];
    const orgId = Array.isArray(orgHeader) ? orgHeader[0] : orgHeader ?? null;
    // Extract and validate client IP to prevent spoofing via x-forwarded-for
    const ip = extractClientIpFromRequest(req);

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
      tap(() => record(res.statusCode ?? 200)),
      catchError((err) => {
        const status = typeof err?.getStatus === "function" ? err.getStatus() : 500;
        record(status);
        throw err;
      })
    );
  }
}
