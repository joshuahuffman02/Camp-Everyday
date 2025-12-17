"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={className || "flex items-center gap-2 text-sm text-slate-500"}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:underline font-medium transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium" : ""}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}

