"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchLeaderboard,
  fetchStaffDashboard,
  listBadgeLibrary,
  listStaff,
  type GamificationBadge,
  type GamificationEvent,
} from "@/lib/gamification/stub-data";
import { launchConfetti } from "@/lib/gamification/confetti";

const categoryLabels: Record<string, string> = {
  task: "Operational Task",
  maintenance: "Maintenance",
  check_in: "Check-in",
  reservation_quality: "Reservation Quality",
  checklist: "Checklist",
  review_mention: "Guest Review Mention",
  on_time_assignment: "On-time Assignment",
  assist: "Assist",
  manual: "Merit XP",
  other: "Other",
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 via-cyan-50 to-emerald-50 opacity-70" />
      <div
        className="h-2 rounded-full bg-emerald-500 transition-all animate-pulse-slow"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function GamificationDashboardPage() {
  const staffOptions = useMemo(() => listStaff(), []);
  const [selectedUserId, setSelectedUserId] = useState<string>(staffOptions[0]?.id || "");
  const [windowKey, setWindowKey] = useState<"weekly" | "seasonal" | "all">("weekly");
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ leaderboard: any[]; viewer: any | null } | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const prevBadgesRef = useRef<number | null>(null);
  const prevTotalRef = useRef<number | null>(null);
  const xpDeltaTimer = useRef<NodeJS.Timeout | null>(null);
  const [xpDelta, setXpDelta] = useState<string | null>(null);
  const [badgeLibrary, setBadgeLibrary] = useState<any[]>([]);
  const [badgeTierFilter, setBadgeTierFilter] = useState<string>("all");
  const earnedBadgeNames = useMemo(() => new Set((dashboard?.badges || []).map((b: any) => b.name)), [dashboard?.badges]);
  const earnedCount = dashboard?.badges?.length ?? 0;
  const totalCount = badgeLibrary.length;

  useEffect(() => {
    let active = true;
    fetchStaffDashboard(selectedUserId || staffOptions[0]?.id || "").then((res) => {
      if (!active) return;
      const levelBefore = prevLevelRef.current;
      const badgeCountBefore = prevBadgesRef.current;

      setDashboard(res);
      if (levelBefore && res.level?.level && res.level.level > levelBefore) {
        launchConfetti({ particles: 160, durationMs: 1400, spread: Math.PI * 1.3 });
      }
      const badgeCountAfter = res.badges?.length ?? 0;
      if (badgeCountBefore !== null && badgeCountAfter > badgeCountBefore) {
        launchConfetti({ particles: 120, durationMs: 1100, spread: Math.PI * 1.2 });
      }
      const completedChallenge = (res.weeklyChallenges || []).find((c: any) => c.status === "completed");
      if (completedChallenge) {
        launchConfetti({ particles: 200, durationMs: 1500, spread: Math.PI * 1.6 });
      }
      const totalAfter = res.balance?.totalXp ?? null;
      if (prevTotalRef.current !== null && totalAfter !== null && totalAfter > prevTotalRef.current) {
        const delta = totalAfter - prevTotalRef.current;
        setXpDelta(`+${delta} XP`);
        if (xpDeltaTimer.current) clearTimeout(xpDeltaTimer.current);
        xpDeltaTimer.current = setTimeout(() => setXpDelta(null), 1500);
      }
      prevLevelRef.current = res.level?.level ?? null;
      prevBadgesRef.current = badgeCountAfter;
      prevTotalRef.current = totalAfter;
    });
    setBadgeLibrary(listBadgeLibrary());
    return () => {
      active = false;
      if (xpDeltaTimer.current) clearTimeout(xpDeltaTimer.current);
    };
  }, [selectedUserId, staffOptions]);

  useEffect(() => {
    let active = true;
    fetchLeaderboard(windowKey, selectedUserId || staffOptions[0]?.id || "").then((res) => {
      if (!active) return;
      setLeaderboard(res);
    });
    return () => {
      active = false;
    };
  }, [selectedUserId, staffOptions, windowKey]);

  const progressPercent = dashboard?.level ? Math.round((dashboard.level.progressToNext || 0) * 100) : 0;
  const xpRemaining = dashboard?.level?.nextMinXp ? dashboard.level.nextMinXp - (dashboard.balance?.totalXp ?? 0) : null;

  const latestBadge = dashboard?.badges?.[0];
  const firstChallenge = dashboard?.weeklyChallenges?.[0];
  const microGoal =
    firstChallenge && firstChallenge.challenge?.targetXp
      ? Math.max(0, (firstChallenge.challenge.targetXp as number) - (firstChallenge.currentXp as number))
      : null;
  const xpHistory: GamificationEvent[] = (dashboard?.recentEvents || []).slice(0, 5);
  const badgeHistory: GamificationBadge[] = [...(dashboard?.badges || [])]
    .sort((a, b) => Date.parse(b.earnedAt) - Date.parse(a.earnedAt))
    .slice(0, 5);

  return (
    <DashboardShell>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 border border-emerald-100 rounded-xl px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff XP</h1>
            <p className="text-sm text-slate-600">Earn, improve, and celebrate progress together (stub data).</p>
          </div>
          <div className="flex items-center gap-2 text-sm relative">
            <Badge className={dashboard?.enabled ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}>
              {dashboard?.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge variant={dashboard?.allowed ? "default" : "outline"} className={dashboard?.allowed ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""}>
              {dashboard?.allowed ? "Role allowed" : "Role blocked"}
            </Badge>
            {xpDelta && (
              <div className="absolute -bottom-8 right-0 flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 shadow-sm transition opacity-100 animate-bounce">
                <span className="text-emerald-500">✦</span>
                <span>{xpDelta}</span>
              </div>
            )}
          </div>
        </div>

        {dashboard && (
          <Card className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-white border-emerald-100">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Momentum</CardTitle>
                  <CardDescription>Little nudges to keep the streak alive.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Next level: {dashboard.level?.nextLevel ?? "maxed"}</Badge>
                  <Badge variant="outline">Weekly XP: {dashboard.balance?.weeklyXp ?? 0}</Badge>
                  {latestBadge && <Badge variant="outline">Latest badge: {latestBadge.name}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
              <div className="rounded-lg border border-emerald-100 bg-white/70 p-3">
                <div className="font-semibold text-slate-900 mb-1">Keep climbing</div>
                <div>
                  {dashboard.level?.nextMinXp
                    ? `${Math.max(0, xpRemaining ?? 0)} XP to reach Level ${dashboard.level?.nextLevel}. Grab a task, close a ticket, or assist a teammate.`
                    : "You’re at the top level—focus on badges and helping others climb."}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white/70 p-3">
                <div className="font-semibold text-slate-900 mb-1">Challenge focus</div>
                <div>
                  {firstChallenge
                    ? microGoal !== null
                      ? `“${firstChallenge.challenge?.title}” · ${microGoal} XP to complete. One more push and you’ll earn ${firstChallenge.challenge?.rewardBadge || "the badge"}.`
                      : `“${firstChallenge.challenge?.title}” is in progress. Keep stacking XP.`
                    : "Pick a challenge and make it yours this week."}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white/70 p-3">
                <div className="font-semibold text-slate-900 mb-1">Inspiration</div>
                <div>
                  {latestBadge
                    ? `Last win: “${latestBadge.name}.” Recreate that energy today.`
                    : "No badges yet—perfect time to earn your first one!"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-white via-emerald-50/60 to-cyan-50/50 border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle>Who are you viewing?</CardTitle>
            <CardDescription>Switch between staff to see their XP, challenges, and wins.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Staff member</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} · {staff.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gamification</Label>
              <div className="rounded-lg border border-emerald-100 bg-white/80 p-3 text-sm">
                {dashboard?.enabled ? "Opted in for this property" : "Disabled by manager"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role gate</Label>
              <div className="rounded-lg border border-emerald-100 bg-white/80 p-3 text-sm">
                {dashboard?.allowed ? "This role participates" : "Role currently excluded"}
              </div>
            </div>
          </CardContent>
        </Card>

        {dashboard && dashboard.enabled && dashboard.allowed && (
          <>
            <Card className="bg-gradient-to-r from-amber-50 via-white to-emerald-50 border-amber-100">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Daily boost</CardTitle>
                    <CardDescription>Quick prompts to spark the next win.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">Try: assist a teammate</Badge>
                    <Badge variant="outline">Close a checklist</Badge>
                    <Badge variant="outline">Earn a badge</Badge>
                    {(dashboard.balance?.weeklyXp ?? 0) > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Streak on: {dashboard.balance?.weeklyXp} weekly XP</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
                <div className="rounded-lg border border-amber-100 bg-white/70 p-3">
                  <div className="font-semibold text-slate-900 mb-1">90-second win</div>
                  <div>Pick a tiny task and finish it now for a +XP micro-boost.</div>
                </div>
                <div className="rounded-lg border border-amber-100 bg-white/70 p-3">
                  <div className="font-semibold text-slate-900 mb-1">Cheer squad</div>
                  <div>Message a teammate about their last badge to keep momentum high.</div>
                </div>
                <div className="rounded-lg border border-amber-100 bg-white/70 p-3">
                  <div className="font-semibold text-slate-900 mb-1">Stretch goal</div>
                  <div>Pick one challenge and overachieve by 10 XP to lock the badge.</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-white via-emerald-50/50 to-cyan-50/50 border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle>Level</CardTitle>
                  <CardDescription>Based on total XP with next level preview.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-semibold text-slate-900">Level {dashboard.level?.level ?? 1}</div>
                    <div className="text-slate-600">
                      {dashboard.level?.nextLevel ? `Next: Level ${dashboard.level.nextLevel}` : "Top level"}
                    </div>
                  </div>
                  <ProgressBar value={progressPercent} />
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div>{dashboard.balance?.totalXp ?? 0} XP total</div>
                    <div>
                      {dashboard.level?.nextMinXp
                        ? `${Math.max(0, xpRemaining ?? 0)} XP to Level ${dashboard.level.nextLevel}`
                        : "At highest defined level"}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div className="rounded border border-slate-200 p-2">
                      <div className="font-semibold text-slate-900">{dashboard.balance?.weeklyXp ?? 0} XP</div>
                      <div>Weekly window</div>
                    </div>
                    <div className="rounded border border-slate-200 p-2">
                      <div className="font-semibold text-slate-900">{dashboard.balance?.seasonalXp ?? 0} XP</div>
                      <div>Seasonal window</div>
                    </div>
                    <div className="rounded border border-slate-200 p-2">
                      <div className="font-semibold text-slate-900">{dashboard.badges?.length ?? 0}</div>
                      <div>Badges</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white via-cyan-50/50 to-emerald-50/50 border-cyan-100 shadow-sm">
                <CardHeader>
                  <CardTitle>Weekly challenges</CardTitle>
                  <CardDescription>Focused goals with badge rewards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dashboard.weeklyChallenges || []).length === 0 && <div className="text-sm text-slate-600">No active challenges.</div>}
                  {(dashboard.weeklyChallenges || []).map((ch: any) => {
                    const pct = Math.min(100, Math.round((ch.currentXp / (ch.challenge?.targetXp || 1)) * 100));
                    return (
                      <div key={ch.challengeId} className="rounded border border-slate-100 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-semibold text-slate-900">{ch.challenge?.title || "Challenge"}</div>
                            <div className="text-xs text-slate-500">{ch.challenge?.description}</div>
                          </div>
                          <Badge variant={ch.status === "completed" ? "default" : "outline"}>{ch.status === "completed" ? "Completed" : "In progress"}</Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <ProgressBar value={pct} />
                          <div>
                            {ch.currentXp} / {ch.challenge?.targetXp} XP · Reward: {ch.challenge?.rewardBadge || "badge"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-white via-emerald-50/60 to-white border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Earned by completing challenges or outstanding work.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(dashboard.badges || []).length === 0 && <div className="text-sm text-slate-600">No badges yet.</div>}
                {(dashboard.badges || []).map((badge: any) => (
                  <div
                    key={badge.id}
                    className="relative rounded border border-slate-200 p-3 space-y-1 bg-gradient-to-br from-white via-emerald-50/40 to-white transition duration-200 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200 overflow-hidden"
                  >
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(94,234,212,0.14),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.12),transparent_35%)] animate-pulse" />
                    <div className="flex items-center justify-between text-sm relative">
                      <div className="font-semibold text-slate-900">{badge.name}</div>
                      {badge.tier && <Badge variant="outline" className="animate-pulse">✦ {badge.tier}</Badge>}
                    </div>
                    <div className="text-xs text-slate-600 relative">{badge.description}</div>
                    <div className="text-[11px] text-slate-500 relative">Earned {new Date(badge.earnedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-cyan-50/50 to-emerald-50/50 border-cyan-100 shadow-sm">
              <CardHeader>
                <CardTitle>Badge library (stub)</CardTitle>
                <CardDescription>
                  Earned {earnedCount} of {totalCount || "-"} · Filter by tier.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="col-span-full flex flex-wrap gap-2 text-xs mb-2">
                  {["all", "bronze", "silver", "gold", "platinum"].map((tier) => (
                    <Button
                      key={tier}
                      size="sm"
                      variant={badgeTierFilter === tier ? "default" : "outline"}
                      onClick={() => setBadgeTierFilter(tier)}
                    >
                      {tier === "all" ? "All tiers" : tier}
                    </Button>
                  ))}
                </div>
                {badgeLibrary
                  .filter((badge) => badgeTierFilter === "all" || badge.tier === badgeTierFilter)
                  .sort((a, b) => {
                    const aEarned = earnedBadgeNames.has(a.name);
                    const bEarned = earnedBadgeNames.has(b.name);
                    if (aEarned === bEarned) return 0;
                    return aEarned ? -1 : 1;
                  })
                  .map((badge) => {
                    const isEarned = earnedBadgeNames.has(badge.name);
                    return (
                      <div key={badge.id} className="rounded border border-slate-200 p-3 bg-white/80">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-semibold text-slate-900">{badge.name}</div>
                          <div className="flex items-center gap-2">
                            {badge.tier && <Badge variant="outline">{badge.tier}</Badge>}
                            <Badge variant={isEarned ? "default" : "outline"} className={isEarned ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}>
                              {isEarned ? "Earned" : "Available 🔒"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600">{badge.description}</div>
                      </div>
                    );
                  })}
                {badgeLibrary.length === 0 && <div className="text-sm text-slate-600">No badges defined.</div>}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-cyan-50/60 to-white border-cyan-100 shadow-sm">
              <CardHeader>
                <CardTitle>Recent XP</CardTitle>
                <CardDescription>Latest events for the selected staff member.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(dashboard.recentEvents || []).length === 0 && <div className="text-sm text-slate-600">No XP events yet.</div>}
                {(dashboard.recentEvents || []).map((evt: any) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between border border-slate-100 rounded-lg p-3 bg-white/80 transition hover:-translate-y-[2px] hover:shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{categoryLabels[evt.category] || evt.category}</div>
                      <div className="text-xs text-slate-500">
                        {evt.reason || "No reason provided"} · {new Date(evt.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={evt.xp >= 0 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                      {evt.xp >= 0 ? "+" : ""}
                      {evt.xp} XP
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/40 border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle>History</CardTitle>
                <CardDescription>Lightweight XP and badge timeline for this user.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">XP awards</div>
                  <div className="rounded border border-slate-100 divide-y bg-white/80">
                    {xpHistory.map((evt) => (
                      <div key={evt.id} className="flex items-center justify-between px-3 py-2">
                        <div>
                          <div className="font-semibold text-slate-900">{categoryLabels[evt.category] || evt.category}</div>
                          <div className="text-[11px] text-slate-500">{new Date(evt.createdAt).toLocaleString()}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          +{evt.xp} XP
                        </Badge>
                      </div>
                    ))}
                    {xpHistory.length === 0 && <div className="px-3 py-2 text-slate-600">No XP yet.</div>}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Badges</div>
                  <div className="rounded border border-slate-100 divide-y bg-white/80">
                    {badgeHistory.map((badge) => (
                      <div key={badge.id} className="flex items-center justify-between px-3 py-2">
                        <div>
                          <div className="font-semibold text-slate-900">{badge.name}</div>
                          <div className="text-[11px] text-slate-500">{new Date(badge.earnedAt).toLocaleString()}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {badge.tier || "badge"}
                        </Badge>
                      </div>
                    ))}
                    {badgeHistory.length === 0 && <div className="px-3 py-2 text-slate-600">No badges yet.</div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-emerald-50/50 to-cyan-50/50 border-emerald-100 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Leaderboard</CardTitle>
                    <CardDescription>XP totals per window (stubbed). Cheer the climbs.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={windowKey === "weekly" ? "default" : "outline"} onClick={() => setWindowKey("weekly")}>
                      Weekly
                    </Button>
                    <Button size="sm" variant={windowKey === "seasonal" ? "default" : "outline"} onClick={() => setWindowKey("seasonal")}>
                      Seasonal
                    </Button>
                    <Button size="sm" variant={windowKey === "all" ? "default" : "outline"} onClick={() => setWindowKey("all")}>
                      All-time
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(leaderboard?.leaderboard?.length ?? 0) === 0 && <div className="text-sm text-slate-600">No XP events yet.</div>}
                {(leaderboard?.leaderboard || []).map((row) => {
                  const isViewer = leaderboard?.viewer?.userId === row.userId;
                  return (
                    <div
                      key={row.userId}
                      className={`flex items-center justify-between rounded border border-slate-100 px-3 py-2 transition hover:-translate-y-[2px] hover:shadow-sm ${
                        isViewer ? "bg-emerald-50/70 border-emerald-100" : "bg-white/80"
                      }`}
                    >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-10 justify-center">{row.rank}</Badge>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{row.name}</div>
                          <div className="text-xs text-slate-500">{isViewer ? "You" : row.role || "staff"}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">+{row.xp} XP</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white via-emerald-50/50 to-white border-emerald-100 shadow-sm">
              <CardHeader>
                <CardTitle>XP by category (stub)</CardTitle>
                <CardDescription>Shows where XP is coming from.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(dashboard.categories || []).length === 0 && <div className="text-sm text-slate-600">No XP yet in this window.</div>}
                {(dashboard.categories || []).map((c: any) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <div className="text-slate-700">{categoryLabels[c.category] || c.category}</div>
                    <div className="font-semibold text-slate-900">+{c.xp} XP</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Staff-only gamification. Guests never see these signals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div>Opt-in is controlled by managers under Settings → Gamification.</div>
                <div>XP sources: tasks, maintenance closures, clean check-ins/reservations, checklists, review mentions, assists, on-time assignments, manual merit.</div>
                <div>Stub data only; no live API calls.</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

