"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type QuickActionItem = {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
};

interface MobileQuickActionsBarProps {
  items: QuickActionItem[];
  active?: string;
  className?: string;
}

export function MobileQuickActionsBar({ items, active, className }: MobileQuickActionsBarProps) {
  return (
    <nav
      className={cn(
        "md:hidden fixed inset-x-4 bottom-4 z-50",
        className
      )}
      aria-label="Mobile quick actions"
    >
      <div className="rounded-2xl border bg-white/95 backdrop-blur shadow-xl shadow-slate-900/10 px-2 py-2 flex gap-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-medium flex flex-col items-center justify-center gap-1 transition-colors",
              active === item.key
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            )}
            aria-label={item.label}
          >
            <div className="flex items-center gap-1">
              {item.icon}
              {typeof item.badge === "number" && item.badge > 0 ? (
                <span className={cn(
                  "ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-900/10 px-1 text-[11px] font-semibold",
                  active === item.key ? "bg-white/20 text-white" : "text-slate-700"
                )}>
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

