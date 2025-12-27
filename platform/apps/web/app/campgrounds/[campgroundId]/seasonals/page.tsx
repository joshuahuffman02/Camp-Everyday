"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "../../../../components/ui/layout/DashboardShell";
import { Breadcrumbs } from "../../../../components/breadcrumbs";
import { apiClient } from "../../../../lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { format } from "date-fns";
import {
  Users,
  DollarSign,
  FileText,
  Mail,
  MessageSquare,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Send,
  X,
  ChevronRight,
  Settings,
  RefreshCw,
  Download,
  Sparkles,
} from "lucide-react";

// Types
type SeasonalStatus = "active" | "pending_renewal" | "not_renewing" | "departed" | "waitlist";
type RenewalIntent = "committed" | "likely" | "undecided" | "not_renewing";
type PaymentStatus = "current" | "past_due" | "paid_ahead";

interface SeasonalGuest {
  id: string;
  guestId: string;
  guest: {
    primaryFirstName: string;
    primaryLastName: string;
    email: string;
    phone?: string;
  };
  currentSite?: {
    id: string;
    name: string;
  };
  currentSiteId?: string;
  status: SeasonalStatus;
  renewalIntent?: RenewalIntent;
  totalSeasons: number;
  firstSeasonYear: number;
  seniorityRank?: number;
  isMetered: boolean;
  paysInFull: boolean;
  payments: Array<{
    status: string;
    dueDate: string;
    amount: number;
  }>;
  pricing: Array<{
    seasonYear: number;
    finalRate: number;
  }>;
}

interface DashboardStats {
  totalSeasonals: number;
  activeSeasonals: number;
  renewalRate: number;
  contractsSigned: number;
  contractsTotal: number;
  paymentsCurrent: number;
  paymentsPastDue: number;
  paymentsPaidAhead: number;
  totalMonthlyRevenue: number;
  averageTenure: number;
  needsAttention: {
    pastDuePayments: number;
    expiringContracts: number;
    expiredInsurance: number;
    pendingRenewals: number;
  };
}

// Helper components
function StatusBadge({ status }: { status: SeasonalStatus }) {
  const styles: Record<SeasonalStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending_renewal: "bg-amber-100 text-amber-700 border-amber-200",
    not_renewing: "bg-rose-100 text-rose-700 border-rose-200",
    departed: "bg-slate-100 text-slate-700 border-slate-200",
    waitlist: "bg-blue-100 text-blue-700 border-blue-200",
  };
  const labels: Record<SeasonalStatus, string> = {
    active: "Active",
    pending_renewal: "Pending Renewal",
    not_renewing: "Not Renewing",
    departed: "Departed",
    waitlist: "Waitlist",
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

function RenewalIntentBadge({ intent }: { intent?: RenewalIntent }) {
  if (!intent) return <Badge variant="outline" className="bg-slate-50 text-slate-500">Unknown</Badge>;

  const styles: Record<RenewalIntent, string> = {
    committed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    likely: "bg-green-100 text-green-700 border-green-200",
    undecided: "bg-amber-100 text-amber-700 border-amber-200",
    not_renewing: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const labels: Record<RenewalIntent, string> = {
    committed: "Committed",
    likely: "Likely",
    undecided: "Undecided",
    not_renewing: "Not Returning",
  };
  return (
    <Badge variant="outline" className={styles[intent]}>
      {labels[intent]}
    </Badge>
  );
}

function PaymentStatusBadge({ seasonal }: { seasonal: SeasonalGuest }) {
  const hasPastDue = seasonal.payments.some((p) => p.status === "past_due");
  const hasDue = seasonal.payments.some((p) => p.status === "due" || p.status === "scheduled");

  if (hasPastDue) {
    return (
      <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Past Due
      </Badge>
    );
  }
  if (!hasDue) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        <Sparkles className="h-3 w-3 mr-1" />
        Paid Ahead
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
      <CheckCircle className="h-3 w-3 mr-1" />
      Current
    </Badge>
  );
}

function TenureBadge({ years }: { years: number }) {
  if (years >= 10) {
    return (
      <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0">
        <Award className="h-3 w-3 mr-1" />
        {years} Years
      </Badge>
    );
  }
  if (years >= 5) {
    return (
      <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">
        <Award className="h-3 w-3 mr-1" />
        {years} Years
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-slate-50">
      {years} {years === 1 ? "Year" : "Years"}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "slate",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: { value: number; label: string };
  color?: "emerald" | "amber" | "rose" | "blue" | "purple" | "slate";
}) {
  const colorClasses = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    slate: "text-slate-600",
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {trend && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-${color}-50`}>
            <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NeedsAttentionCard({ stats }: { stats: DashboardStats["needsAttention"] }) {
  const items = [
    { label: "Past due payments", count: stats.pastDuePayments, icon: DollarSign, color: "text-rose-600" },
    { label: "Expiring contracts", count: stats.expiringContracts, icon: FileText, color: "text-amber-600" },
    { label: "Expired insurance", count: stats.expiredInsurance, icon: AlertCircle, color: "text-orange-600" },
    { label: "Pending renewals", count: stats.pendingRenewals, icon: Clock, color: "text-blue-600" },
  ].filter((item) => item.count > 0);

  if (items.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-4 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-medium text-emerald-800">All caught up!</p>
          <p className="text-sm text-emerald-600">No items need attention</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          Needs Attention ({items.reduce((sum, i) => sum + i.count, 0)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100"
          >
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm">{item.label}</span>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {item.count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SeasonalsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const campgroundId = params.campgroundId as string;
  const currentYear = new Date().getFullYear();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SeasonalStatus | "all">("all");
  const [renewalFilter, setRenewalFilter] = useState<RenewalIntent | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [selectedSeasonal, setSelectedSeasonal] = useState<SeasonalGuest | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedForMessage, setSelectedForMessage] = useState<string[]>([]);
  const [messageChannel, setMessageChannel] = useState<"email" | "sms">("email");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  // Queries
  const statsQuery = useQuery({
    queryKey: ["seasonal-stats", campgroundId, currentYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/seasonals/campground/${campgroundId}/stats?seasonYear=${currentYear}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json() as Promise<DashboardStats>;
    },
    enabled: !!campgroundId,
  });

  const seasonalsQuery = useQuery({
    queryKey: ["seasonals", campgroundId, statusFilter, renewalFilter, paymentFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (renewalFilter !== "all") params.set("renewalIntent", renewalFilter);
      if (paymentFilter !== "all") params.set("paymentStatus", paymentFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(
        `/api/seasonals/campground/${campgroundId}?${params.toString()}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch seasonals");
      return response.json() as Promise<{ data: SeasonalGuest[]; total: number }>;
    },
    enabled: !!campgroundId,
  });

  // Mutations
  const updateRenewalMutation = useMutation({
    mutationFn: async ({ id, intent, notes }: { id: string; intent: RenewalIntent; notes?: string }) => {
      const response = await fetch(`/api/seasonals/${id}/renewal-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ intent, notes }),
      });
      if (!response.ok) throw new Error("Failed to update renewal intent");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasonals", campgroundId] });
      queryClient.invalidateQueries({ queryKey: ["seasonal-stats", campgroundId] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/seasonals/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          campgroundId,
          seasonalGuestIds: selectedForMessage,
          channel: messageChannel,
          subject: messageSubject,
          body: messageBody,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setShowMessageModal(false);
      setSelectedForMessage([]);
      setMessageSubject("");
      setMessageBody("");
    },
  });

  const stats = statsQuery.data;
  const seasonals = seasonalsQuery.data?.data || [];

  const toggleSelectAll = () => {
    if (selectedForMessage.length === seasonals.length) {
      setSelectedForMessage([]);
    } else {
      setSelectedForMessage(seasonals.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedForMessage((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Campgrounds", href: "/campgrounds?all=true" },
            { label: `Campground`, href: `/campgrounds/${campgroundId}` },
            { label: "Seasonals" },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Seasonal Guests</h1>
            <p className="text-sm text-slate-500">
              Manage your seasonal community - {currentYear} Season
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/campgrounds/${campgroundId}/seasonals/rate-cards`}>
                <Settings className="h-4 w-4 mr-1" />
                Rate Cards
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMessageModal(true)}
              disabled={selectedForMessage.length === 0}
            >
              <Send className="h-4 w-4 mr-1" />
              Message ({selectedForMessage.length})
            </Button>
            <Button size="sm" asChild>
              <a href={`/campgrounds/${campgroundId}/seasonals/new`}>
                <Plus className="h-4 w-4 mr-1" />
                Add Seasonal
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard
              title="Total Seasonals"
              value={stats.totalSeasonals}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Renewal Rate"
              value={`${stats.renewalRate}%`}
              subtitle={`${stats.contractsSigned}/${stats.contractsTotal} signed`}
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              title="Payments Current"
              value={stats.paymentsCurrent}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Past Due"
              value={stats.paymentsPastDue}
              icon={AlertCircle}
              color="rose"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${stats.totalMonthlyRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="purple"
            />
            <StatCard
              title="Avg Tenure"
              value={`${stats.averageTenure} yrs`}
              icon={Award}
              color="amber"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Needs Attention */}
          <div className="lg:col-span-1">
            {stats && <NeedsAttentionCard stats={stats.needsAttention} />}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="list" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    All Seasonals
                  </TabsTrigger>
                  <TabsTrigger value="renewals" className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Renewals
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Payments
                  </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-48"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as SeasonalStatus | "all")}
                    className="text-sm border border-slate-200 rounded px-2 py-1.5"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending_renewal">Pending Renewal</option>
                    <option value="not_renewing">Not Renewing</option>
                    <option value="waitlist">Waitlist</option>
                  </select>
                  <select
                    value={renewalFilter}
                    onChange={(e) => setRenewalFilter(e.target.value as RenewalIntent | "all")}
                    className="text-sm border border-slate-200 rounded px-2 py-1.5"
                  >
                    <option value="all">All Renewal</option>
                    <option value="committed">Committed</option>
                    <option value="likely">Likely</option>
                    <option value="undecided">Undecided</option>
                    <option value="not_renewing">Not Returning</option>
                  </select>
                </div>
              </div>

              <TabsContent value="list" className="space-y-4">
                {/* Bulk select */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <input
                    type="checkbox"
                    checked={selectedForMessage.length === seasonals.length && seasonals.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                  <span>Select all ({seasonals.length})</span>
                </div>

                {/* Seasonal List */}
                {seasonalsQuery.isLoading ? (
                  <div className="text-center py-12 text-slate-500">Loading seasonals...</div>
                ) : seasonals.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No seasonal guests found</p>
                    <Button size="sm" className="mt-3" asChild>
                      <a href={`/campgrounds/${campgroundId}/seasonals/new`}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Seasonal
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {seasonals.map((seasonal) => (
                      <Card
                        key={seasonal.id}
                        className={`p-4 hover:shadow-md transition-all cursor-pointer ${
                          selectedForMessage.includes(seasonal.id)
                            ? "ring-2 ring-blue-500 bg-blue-50/30"
                            : ""
                        }`}
                        onClick={() => setSelectedSeasonal(seasonal)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedForMessage.includes(seasonal.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(seasonal.id);
                            }}
                            className="rounded"
                          />

                          {/* Avatar/Initials */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {seasonal.guest.primaryFirstName[0]}
                            {seasonal.guest.primaryLastName[0]}
                          </div>

                          {/* Main Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {seasonal.guest.primaryFirstName} {seasonal.guest.primaryLastName}
                              </span>
                              <TenureBadge years={seasonal.totalSeasons} />
                              {seasonal.seniorityRank && seasonal.seniorityRank <= 3 && (
                                <Badge className="bg-amber-500 text-white">
                                  #{seasonal.seniorityRank} Seniority
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                              {seasonal.currentSite && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {seasonal.currentSite.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {seasonal.guest.email}
                              </span>
                              {seasonal.guest.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {seasonal.guest.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={seasonal.status} />
                            <RenewalIntentBadge intent={seasonal.renewalIntent} />
                            <PaymentStatusBadge seasonal={seasonal} />
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="renewals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Renewal Tracking</CardTitle>
                    <CardDescription>
                      Track and update renewal intentions for the {currentYear + 1} season
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-emerald-700">
                          {seasonals.filter((s) => s.renewalIntent === "committed").length}
                        </div>
                        <div className="text-sm text-emerald-600">Committed</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {seasonals.filter((s) => s.renewalIntent === "likely").length}
                        </div>
                        <div className="text-sm text-green-600">Likely</div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-amber-700">
                          {seasonals.filter((s) => s.renewalIntent === "undecided" || !s.renewalIntent).length}
                        </div>
                        <div className="text-sm text-amber-600">Undecided</div>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-rose-700">
                          {seasonals.filter((s) => s.renewalIntent === "not_renewing").length}
                        </div>
                        <div className="text-sm text-rose-600">Not Returning</div>
                      </div>
                    </div>

                    {/* Undecided list for quick action */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-700">Need to Follow Up</h4>
                      {seasonals
                        .filter((s) => !s.renewalIntent || s.renewalIntent === "undecided")
                        .slice(0, 5)
                        .map((seasonal) => (
                          <div
                            key={seasonal.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium text-sm">
                                {seasonal.guest.primaryFirstName[0]}
                                {seasonal.guest.primaryLastName[0]}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {seasonal.guest.primaryFirstName} {seasonal.guest.primaryLastName}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {seasonal.totalSeasons} years at {seasonal.currentSite?.name || "TBD"}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:bg-emerald-50"
                                onClick={() =>
                                  updateRenewalMutation.mutate({
                                    id: seasonal.id,
                                    intent: "committed",
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Committed
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() =>
                                  updateRenewalMutation.mutate({
                                    id: seasonal.id,
                                    intent: "not_renewing",
                                  })
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
                                Not Returning
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Overview</CardTitle>
                    <CardDescription>
                      Track seasonal payment status and record incoming payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-emerald-700">
                          {stats?.paymentsCurrent || 0}
                        </div>
                        <div className="text-sm text-emerald-600">Current</div>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-rose-700">
                          {stats?.paymentsPastDue || 0}
                        </div>
                        <div className="text-sm text-rose-600">Past Due</div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-amber-700">
                          {stats?.paymentsPaidAhead || 0}
                        </div>
                        <div className="text-sm text-amber-600">Paid Ahead</div>
                      </div>
                    </div>

                    {/* Past due list */}
                    {seasonals.filter((s) => s.payments.some((p) => p.status === "past_due")).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-rose-700 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Past Due Payments
                        </h4>
                        {seasonals
                          .filter((s) => s.payments.some((p) => p.status === "past_due"))
                          .map((seasonal) => {
                            const pastDue = seasonal.payments.find((p) => p.status === "past_due");
                            return (
                              <div
                                key={seasonal.id}
                                className="flex items-center justify-between p-3 border border-rose-200 bg-rose-50/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-medium text-sm">
                                    {seasonal.guest.primaryFirstName[0]}
                                    {seasonal.guest.primaryLastName[0]}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {seasonal.guest.primaryFirstName} {seasonal.guest.primaryLastName}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      ${pastDue?.amount} due{" "}
                                      {pastDue?.dueDate && format(new Date(pastDue.dueDate), "MMM d")}
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm">
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  Record Payment
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Send Message to {selectedForMessage.length} Seasonals</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMessageModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={messageChannel === "email" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMessageChannel("email")}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant={messageChannel === "sms" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMessageChannel("sms")}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    SMS
                  </Button>
                </div>

                {messageChannel === "email" && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Subject</label>
                    <Input
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Message subject..."
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700">Message</label>
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Hi {{first_name}}, ..."
                    rows={5}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Available tokens: {"{{first_name}}"}, {"{{last_name}}"}, {"{{site}}"}, {"{{tenure_years}}"}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowMessageModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!messageBody || sendMessageMutation.isPending}
                    onClick={() => sendMessageMutation.mutate()}
                  >
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seasonal Detail Slide-out would go here */}
      </div>
    </DashboardShell>
  );
}
