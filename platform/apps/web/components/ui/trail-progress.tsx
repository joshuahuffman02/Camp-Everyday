"use client";

import { cn } from "@/lib/utils";

interface TrailProgressProps {
  /** Progress value from 0-100 */
  value?: number;
  /** Whether to show indeterminate shimmer animation */
  indeterminate?: boolean;
  /** Height variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
  /** Show percentage text */
  showPercentage?: boolean;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function TrailProgress({
  value = 0,
  indeterminate = false,
  size = "md",
  className,
  showPercentage = false,
}: TrailProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-slate-200",
          sizeClasses[size]
        )}
      >
        {/* Trail markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[25, 50, 75].map((marker) => (
            <div
              key={marker}
              className="w-0.5 h-full bg-slate-300"
              style={{ marginLeft: `${marker - 1}%` }}
            />
          ))}
        </div>

        {/* Progress fill */}
        {indeterminate ? (
          <div
            className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 animate-shimmer"
            style={{
              backgroundSize: "200% 100%",
            }}
          />
        ) : (
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${clampedValue}%` }}
          >
            {/* Shimmer overlay on progress */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Hiker/tent marker at current position */}
        {!indeterminate && clampedValue > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-emerald-500 shadow-sm transition-all duration-300"
            style={{ left: `calc(${clampedValue}% - 6px)` }}
          />
        )}
      </div>

      {showPercentage && !indeterminate && (
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Start</span>
          <span>{Math.round(clampedValue)}%</span>
          <span>Destination</span>
        </div>
      )}
    </div>
  );
}

// Multi-step trail progress with labeled checkpoints
interface TrailCheckpoint {
  label: string;
  complete?: boolean;
}

interface TrailProgressStepsProps {
  checkpoints: TrailCheckpoint[];
  currentStep: number;
  className?: string;
}

export function TrailProgressSteps({
  checkpoints,
  currentStep,
  className,
}: TrailProgressStepsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {/* Connecting line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200" />
        <div
          className="absolute top-3 left-0 h-0.5 bg-emerald-500 transition-all duration-500"
          style={{
            width: `${(currentStep / (checkpoints.length - 1)) * 100}%`,
          }}
        />

        {/* Checkpoints */}
        {checkpoints.map((checkpoint, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              className="relative flex flex-col items-center"
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10",
                  isComplete
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                    ? "bg-white border-emerald-500 text-emerald-500"
                    : "bg-white border-slate-300 text-slate-400"
                )}
              >
                {isComplete ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px]",
                  isComplete || isCurrent
                    ? "text-slate-900"
                    : "text-slate-400"
                )}
              >
                {checkpoint.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
