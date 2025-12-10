import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ObservabilityService } from "./observability.service";
import { performance } from "perf_hooks";

@Injectable()
export class RequestMetricsInterceptor implements NestInterceptor {
  constructor(private readonly observability: ObservabilityService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest() as any;
    const start = performance.now();
    const path = req?.originalUrl || req?.url || "unknown";
    const method = req?.method || "UNKNOWN";

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = performance.now() - start;
          this.observability.recordApiRequest({
            method,
            path,
            status: 200,
            durationMs,
          });
        },
        error: (err: any) => {
          const durationMs = performance.now() - start;
          const status = typeof err?.status === "number" ? err.status : 500;
          this.observability.recordApiRequest({
            method,
            path,
            status,
            durationMs,
          });
        },
      })
    );
  }
}

