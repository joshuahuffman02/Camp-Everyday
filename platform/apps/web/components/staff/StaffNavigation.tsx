"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckSquare,
  Receipt,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffNavigationProps {
  campgroundId: string;
}

const navItems = [
  {
    href: (id: string) => `/campgrounds/${id}/staff-scheduling`,
    label: "Scheduling",
    icon: Calendar,
    description: "Plan & manage shifts",
    matchPaths: ["/staff-scheduling"],
  },
  {
    href: (id: string) => `/campgrounds/${id}/staff/timeclock`,
    label: "Time Clock",
    icon: Clock,
    description: "Clock in & out",
    matchPaths: ["/staff/timeclock"],
  },
  {
    href: (id: string) => `/campgrounds/${id}/staff/approvals`,
    label: "Approvals",
    icon: CheckSquare,
    description: "Review timesheets",
    matchPaths: ["/staff/approvals"],
  },
  {
    href: (id: string) => `/campgrounds/${id}/staff/overrides`,
    label: "Overrides",
    icon: Receipt,
    description: "Comps & discounts",
    matchPaths: ["/staff/overrides"],
  },
];

export function StaffNavigation({ campgroundId }: StaffNavigationProps) {
  const pathname = usePathname();

  const isActive = (matchPaths: string[]) => {
    return matchPaths.some((path) => pathname.includes(path));
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-600">Schedule, track time, and manage your team</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl" role="tablist" aria-label="Staff management sections">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.matchPaths);

          return (
            <Link
              key={item.label}
              href={item.href(campgroundId)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                active
                  ? "text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.div
                  layoutId="staff-nav-indicator"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className={cn("w-4 h-4", active ? "text-teal-600" : "text-slate-500")} />
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
