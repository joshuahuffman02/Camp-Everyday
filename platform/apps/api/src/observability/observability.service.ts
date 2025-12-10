import { Injectable } from "@nestjs/common";

type ApiSample = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  at: number;
};

type JobSample = {
  name: string;
  durationMs: number;
  success: boolean;
  queueDepth: number;
  at: number;
};

type Aggregate = {
  count: number;
  errors: number;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
};

type ObservabilitySnapshot = {
  captured: number;
  targets: {
    apiP95Ms: number;
    apiErrorRate: number;
    jobP95Ms: number;
    jobFailureRate: number;
  };
  api: Aggregate & {
    recentErrors: { path: string; status: number; at: number }[];
  };
  jobs: Aggregate & {
    queues: Record<string, { running: number; queued: number }>;
  };
};

@Injectable()
export class ObservabilityService {
  private readonly apiSamples: ApiSample[] = [];
  private readonly jobSamples: JobSample[] = [];
  private readonly queues: Record<string, { running: number; queued: number }> = {};
  private readonly maxSamples = Number(process.env.OBS_MAX_SAMPLES ?? 800);
  private readonly targets = {
    apiP95Ms: Number(process.env.SLO_API_P95_MS ?? 800),
    apiErrorRate: Number(process.env.SLO_API_ERROR_RATE ?? 0.01),
    jobP95Ms: Number(process.env.SLO_JOB_P95_MS ?? 30000),
    jobFailureRate: Number(process.env.SLO_JOB_FAILURE_RATE ?? 0.02),
  };

  recordApiRequest(sample: Omit<ApiSample, "at">) {
    this.apiSamples.unshift({ ...sample, at: Date.now() });
    if (this.apiSamples.length > this.maxSamples) {
      this.apiSamples.pop();
    }
  }

  recordJobRun(sample: Omit<JobSample, "at">) {
    this.jobSamples.unshift({ ...sample, at: Date.now() });
    if (this.jobSamples.length > this.maxSamples) {
      this.jobSamples.pop();
    }
  }

  setQueueState(queue: string, running: number, queued: number) {
    this.queues[queue] = { running, queued };
  }

  snapshot(): ObservabilitySnapshot {
    const apiAgg = this.aggregate(this.apiSamples.map((s) => s.durationMs));
    const jobAgg = this.aggregate(this.jobSamples.map((s) => s.durationMs));

    return {
      captured: Math.max(this.apiSamples.length, this.jobSamples.length),
      targets: this.targets,
      api: {
        ...apiAgg,
        errors: this.apiSamples.filter((s) => s.status >= 400).length,
        recentErrors: this.apiSamples
          .filter((s) => s.status >= 400)
          .slice(0, 10)
          .map((s) => ({ path: s.path, status: s.status, at: s.at })),
      },
      jobs: {
        ...jobAgg,
        errors: this.jobSamples.filter((s) => !s.success).length,
        queues: this.queues,
      },
    };
  }

  private aggregate(durations: number[]): Aggregate {
    if (durations.length === 0) {
      return { count: 0, errors: 0, p50: 0, p95: 0, p99: 0, avg: 0 };
    }
    const sorted = [...durations].sort((a, b) => a - b);
    const quantile = (p: number) => {
      const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
      return sorted[idx];
    };
    const total = sorted.reduce((sum, n) => sum + n, 0);
    return {
      count: durations.length,
      errors: 0,
      p50: quantile(0.5),
      p95: quantile(0.95),
      p99: quantile(0.99),
      avg: Math.round((total / durations.length) * 100) / 100,
    };
  }
}

