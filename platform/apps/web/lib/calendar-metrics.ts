type MetricPayload = Record<string, unknown>;

function dispatchMetric(name: string, detail: MetricPayload) {
  if (typeof window === "undefined") return;
  const payload = { name, detail, ts: Date.now() };
  try {
    window.dispatchEvent(new CustomEvent("calendar-metric", { detail: payload }));
  } catch {
    // noop
  }
  // Lightweight console trace for debugging; can be picked up by log forwarders.
  // Avoid network calls here to keep the calendar resilient.
  console.debug("[calendar]", name, detail);
}

export function recordMetric(name: string, detail: MetricPayload = {}) {
  dispatchMetric(name, detail);
}

export function recordError(stage: string, error: unknown) {
  const err = error as Error & { status?: number };
  dispatchMetric("calendar.error", {
    stage,
    message: err?.message ?? "unknown error",
    status: err?.status
  });
}

export function startTiming(label: string) {
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    end(extra: MetricPayload = {}) {
      const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      const durationMs = endedAt - startedAt;
      recordMetric("calendar.timing", { label, durationMs, ...extra });
      return durationMs;
    }
  };
}

