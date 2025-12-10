"use client";

import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Command, Search, Zap } from "lucide-react";
import Link from "next/link";

interface ShortcutGroup {
  title: string;
  icon: any;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Global Navigation",
    icon: Command,
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open global search" },
      { keys: ["⌘", "/"], description: "Focus search bar" },
      { keys: ["ESC"], description: "Close modals/dropdowns" },
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "R"], description: "Go to Reservations" },
      { keys: ["G", "G"], description: "Go to Guests" },
      { keys: ["G", "S"], description: "Go to Sites" },
      { keys: ["G", "P"], description: "Go to Reports" },
    ]
  },
  {
    title: "Search & Filters",
    icon: Search,
    shortcuts: [
      { keys: ["⌘", "K"], description: "Quick search (guests, sites, reservations)" },
      { keys: ["↑", "↓"], description: "Navigate search results" },
      { keys: ["Enter"], description: "Select search result" },
      { keys: ["⌘", "F"], description: "Find in current page" },
      { keys: ["Tab"], description: "Switch between filters" },
    ]
  },
  {
    title: "Reservations",
    icon: Zap,
    shortcuts: [
      { keys: ["N"], description: "New reservation" },
      { keys: ["E"], description: "Edit selected reservation" },
      { keys: ["C"], description: "Check-in guest" },
      { keys: ["O"], description: "Check-out guest" },
      { keys: ["P"], description: "Process payment" },
      { keys: ["⌘", "S"], description: "Save changes" },
      { keys: ["⌘", "⇧", "C"], description: "Cancel reservation" },
    ]
  },
  {
    title: "Reports & Data",
    icon: Command,
    shortcuts: [
      { keys: ["R"], description: "Refresh current report" },
      { keys: ["⌘", "E"], description: "Export to CSV" },
      { keys: ["⌘", "P"], description: "Print report" },
      { keys: ["T"], description: "Switch tab" },
      { keys: ["D"], description: "Open date picker" },
      { keys: ["←", "→"], description: "Previous/Next date range" },
    ]
  },
  {
    title: "Quick Actions",
    icon: Zap,
    shortcuts: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["⌘", ","], description: "Open Settings" },
      { keys: ["⌘", "⇧", "N"], description: "New walk-in booking" },
      { keys: ["⌘", "⇧", "P"], description: "Quick payment entry" },
      { keys: ["⌘", "B"], description: "Toggle sidebar" },
    ]
  }
];

export default function ShortcutsPage() {
  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Help", href: "/help" },
            { label: "Keyboard Shortcuts" }
          ]}
        />

        {/* Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Keyboard Shortcuts</h1>
              <p className="text-slate-600">
                Work faster with keyboard shortcuts for common actions
              </p>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="text-xs font-medium text-slate-600">
                Press <kbd className="px-2 py-0.5 bg-white rounded text-slate-900 border border-slate-200">?</kbd> anytime
              </span>
            </div>
          </div>
        </div>

        {/* Platform Note */}
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Command className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-900 mb-1">
                {isMac ? "Mac Shortcuts" : "Windows/Linux Shortcuts"}
              </div>
              <div className="text-xs text-blue-700">
                {isMac
                  ? "⌘ = Command key, ⇧ = Shift, ⌥ = Option"
                  : "Replace ⌘ with Ctrl on Windows/Linux. Replace ⌥ with Alt."}
              </div>
            </div>
          </div>
        </div>

        {/* Shortcut Groups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shortcutGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
                </div>

                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <kbd
                            key={keyIdx}
                            className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-900 min-w-[32px] text-center"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="card p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Pro Tips</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>Use <kbd className="px-1.5 py-0.5 bg-white rounded text-xs border border-slate-200">⌘K</kbd> to quickly search for anything - guests, sites, reservations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>Sequential shortcuts like <kbd className="px-1.5 py-0.5 bg-white rounded text-xs border border-slate-200">G</kbd> then <kbd className="px-1.5 py-0.5 bg-white rounded text-xs border border-slate-200">R</kbd> should be pressed one after another, not together</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>Most shortcuts work globally throughout the app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>Keyboard shortcuts save an average of 30 minutes per day for power users</span>
            </li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Documentation
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
