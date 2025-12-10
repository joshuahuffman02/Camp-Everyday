"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-emerald-600 hover:text-emerald-700 font-medium">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-500">{item.label}</span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}

