"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { DashboardShell } from "../../../../../components/ui/layout/DashboardShell";
import { Breadcrumbs } from "../../../../../components/breadcrumbs";
import { apiClient } from "../../../../../lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { useToast } from "../../../../../components/ui/use-toast";
import {
  ArrowLeft,
  Pencil,
  X,
  Save,
  Loader2,
  Zap,
  Droplet,
  Waves,
  PawPrint,
  Accessibility,
  Home,
  Tent,
  Users,
  Sparkles,
  DollarSign,
  Layers,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { cn } from "../../../../../lib/utils";
import {
  SPRING_CONFIG,
  staggerContainer,
  staggerChild,
} from "../../../../../lib/animations";

// Site type configuration with icons
const siteTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  rv: { icon: <Home className="h-4 w-4" />, label: "RV", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" },
  tent: { icon: <Tent className="h-4 w-4" />, label: "Tent", color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" },
  cabin: { icon: <Home className="h-4 w-4" />, label: "Cabin", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" },
  group: { icon: <Users className="h-4 w-4" />, label: "Group", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400" },
  glamping: { icon: <Sparkles className="h-4 w-4" />, label: "Glamping", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400" },
};

type EditFormState = {
  name: string;
  description: string;
  defaultRate: number;
  siteType: string;
  maxOccupancy: number;
  rigMaxLength: number | "";
  hookupsPower: boolean;
  hookupsWater: boolean;
  hookupsSewer: boolean;
  minNights: number | "";
  maxNights: number | "";
  petFriendly: boolean;
  accessible: boolean;
  isActive: boolean;
};

export default function SiteClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const campgroundId = params.campgroundId as string;
  const classId = params.classId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const horizonIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const classQuery = useQuery({
    queryKey: ["site-class", classId],
    queryFn: () => apiClient.getSiteClass(classId),
    enabled: !!classId
  });

  const sitesQuery = useQuery({
    queryKey: ["campground-sites", campgroundId],
    queryFn: () => apiClient.getSites(campgroundId),
    enabled: !!campgroundId
  });

  const statusQuery = useQuery({
    queryKey: ["site-class-status", classId, todayIso, horizonIso],
    queryFn: () =>
      apiClient.getSitesWithStatus(campgroundId, {
        arrivalDate: todayIso,
        departureDate: horizonIso
      }),
    enabled: !!campgroundId && !!classId
  });

  const reservationsQuery = useQuery({
    queryKey: ["campground-reservations", campgroundId],
    queryFn: () => apiClient.getReservations(campgroundId),
    enabled: !!campgroundId
  });

  const pricingRulesQuery = useQuery({
    queryKey: ["pricing-rules", campgroundId],
    queryFn: () => apiClient.getPricingRules(campgroundId),
    enabled: !!campgroundId
  });

  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs", campgroundId],
    queryFn: () => apiClient.getAuditLogs(campgroundId, { limit: 50 }),
    enabled: !!campgroundId
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EditFormState>) =>
      apiClient.updateSiteClass(classId, {
        ...data,
        siteType: data.siteType as "rv" | "tent" | "cabin" | "group" | "glamping",
        defaultRate: data.defaultRate ? Math.round(data.defaultRate * 100) : undefined,
        rigMaxLength: data.rigMaxLength === "" ? null : data.rigMaxLength,
        minNights: data.minNights === "" ? null : data.minNights,
        maxNights: data.maxNights === "" ? null : data.maxNights,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-class", classId] });
      queryClient.invalidateQueries({ queryKey: ["site-classes", campgroundId] });
      setIsEditing(false);
      setEditForm(null);
      toast({ title: "Class updated", description: "Changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update class.", variant: "destructive" });
    }
  });

  const classActivity = useMemo(() => {
    const logs = auditLogsQuery.data || [];
    return logs.filter((log: any) => log.entityId === classId).slice(0, 6);
  }, [auditLogsQuery.data, classId]);

  // Initialize edit form when entering edit mode
  const startEditing = () => {
    if (!classQuery.data) return;
    const sc = classQuery.data;
    setEditForm({
      name: sc.name || "",
      description: sc.description || "",
      defaultRate: (sc.defaultRate || 0) / 100,
      siteType: sc.siteType || "rv",
      maxOccupancy: sc.maxOccupancy || 4,
      rigMaxLength: sc.rigMaxLength ?? "",
      hookupsPower: !!sc.hookupsPower,
      hookupsWater: !!sc.hookupsWater,
      hookupsSewer: !!sc.hookupsSewer,
      minNights: sc.minNights ?? "",
      maxNights: sc.maxNights ?? "",
      petFriendly: sc.petFriendly !== false,
      accessible: !!sc.accessible,
      isActive: sc.isActive !== false,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveChanges = () => {
    if (!editForm) return;
    updateMutation.mutate(editForm);
  };

  if (classQuery.isLoading) {
    return (
      <DashboardShell>
        <div className="flex h-80 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading class...</p>
          </motion.div>
        </div>
      </DashboardShell>
    );
  }

  const siteClass = classQuery.data;

  if (!siteClass) {
    return (
      <DashboardShell>
        <div className="flex h-80 flex-col items-center justify-center gap-4 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Layers className="h-8 w-8" />
          </div>
          <div>Site class not found</div>
          <Button onClick={() => router.push(`/campgrounds/${campgroundId}/classes`)}>Back to classes</Button>
        </div>
      </DashboardShell>
    );
  }

  const sitesInClass = (sitesQuery.data || []).filter((s) => s.siteClassId === classId);
  const statusBySite = Object.fromEntries((statusQuery.data || []).map((s) => [s.id, s]));
  const photoList = (siteClass.photos || []).filter(Boolean);

  const upcomingReservations = (reservationsQuery.data || [])
    .filter((res: any) => {
      const resClassId =
        res.siteClassId || res.site?.siteClassId || res.site?.siteClass?.id || res.site?.siteClass?.siteClassId;
      return resClassId === classId && new Date(res.departureDate) >= new Date();
    })
    .sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime())
    .slice(0, 6);

  const classPricingRules = (pricingRulesQuery.data || []).filter(
    (rule: any) => !rule.siteClassId || rule.siteClassId === classId
  );

  const typeConfig = siteTypeConfig[siteClass.siteType] || siteTypeConfig.rv;

  return (
    <DashboardShell>
      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <Breadcrumbs
          items={[
            { label: "Campgrounds", href: "/campgrounds?all=true" },
            { label: `Campground ${campgroundId}`, href: `/campgrounds/${campgroundId}` },
            { label: "Site Classes", href: `/campgrounds/${campgroundId}/classes` },
            { label: siteClass.name }
          ]}
        />

        {/* Header */}
        <motion.div
          variants={staggerChild}
          transition={SPRING_CONFIG}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", typeConfig.color)}>
                {typeConfig.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{siteClass.name}</h1>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Badge variant="secondary" className={cn("gap-1", typeConfig.color)}>
                    {typeConfig.icon}
                    {typeConfig.label}
                  </Badge>
                  <span>•</span>
                  <span>Max {siteClass.maxOccupancy} guests</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={siteClass.isActive ? "default" : "outline"} className={siteClass.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : ""}>
              {siteClass.isActive ? "Active" : "Inactive"}
            </Badge>
            {!isEditing ? (
              <Button onClick={startEditing} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={cancelEditing} disabled={updateMutation.isPending}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={saveChanges} disabled={updateMutation.isPending} className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Edit Form */}
        <AnimatePresence>
          {isEditing && editForm && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={SPRING_CONFIG}
            >
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pencil className="h-5 w-5 text-emerald-600" />
                    Edit Class Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Site Type</Label>
                      <Select
                        value={editForm.siteType}
                        onValueChange={(value) => setEditForm({ ...editForm, siteType: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(siteTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {config.icon}
                                {config.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Rate ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.defaultRate}
                        onChange={(e) => setEditForm({ ...editForm, defaultRate: parseFloat(e.target.value) || 0 })}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Occupancy</Label>
                      <Input
                        type="number"
                        value={editForm.maxOccupancy}
                        onChange={(e) => setEditForm({ ...editForm, maxOccupancy: parseInt(e.target.value) || 1 })}
                        className="bg-background"
                      />
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Rig Max Length (ft)</Label>
                      <Input
                        type="number"
                        value={editForm.rigMaxLength}
                        onChange={(e) => setEditForm({ ...editForm, rigMaxLength: e.target.value === "" ? "" : parseInt(e.target.value) })}
                        placeholder="No limit"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Nights</Label>
                      <Input
                        type="number"
                        value={editForm.minNights}
                        onChange={(e) => setEditForm({ ...editForm, minNights: e.target.value === "" ? "" : parseInt(e.target.value) })}
                        placeholder="No minimum"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Nights</Label>
                      <Input
                        type="number"
                        value={editForm.maxNights}
                        onChange={(e) => setEditForm({ ...editForm, maxNights: e.target.value === "" ? "" : parseInt(e.target.value) })}
                        placeholder="No maximum"
                        className="bg-background"
                      />
                    </div>
                  </div>

                  {/* Hookups */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Hookups</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.hookupsPower}
                          onChange={(e) => setEditForm({ ...editForm, hookupsPower: e.target.checked })}
                          className="rounded border-border"
                        />
                        <Zap className="h-4 w-4 text-amber-500" />
                        Power
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.hookupsWater}
                          onChange={(e) => setEditForm({ ...editForm, hookupsWater: e.target.checked })}
                          className="rounded border-border"
                        />
                        <Droplet className="h-4 w-4 text-blue-500" />
                        Water
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.hookupsSewer}
                          onChange={(e) => setEditForm({ ...editForm, hookupsSewer: e.target.checked })}
                          className="rounded border-border"
                        />
                        <Waves className="h-4 w-4 text-slate-500" />
                        Sewer
                      </label>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Features</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.petFriendly}
                          onChange={(e) => setEditForm({ ...editForm, petFriendly: e.target.checked })}
                          className="rounded border-border"
                        />
                        <PawPrint className="h-4 w-4 text-amber-600" />
                        Pet Friendly
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.accessible}
                          onChange={(e) => setEditForm({ ...editForm, accessible: e.target.checked })}
                          className="rounded border-border"
                        />
                        <Accessibility className="h-4 w-4 text-blue-600" />
                        Accessible
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          className="rounded border-border"
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Optional description..."
                      className="bg-background"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div variants={staggerChild} transition={SPRING_CONFIG}>
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Defaults
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Default rate</div>
                  <div className="font-medium text-lg text-emerald-600 dark:text-emerald-400">${((siteClass.defaultRate ?? 0) / 100).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rig max length</div>
                  <div className="font-medium">{siteClass.rigMaxLength ? `${siteClass.rigMaxLength} ft` : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Min nights</div>
                  <div className="font-medium">{siteClass.minNights ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Max nights</div>
                  <div className="font-medium">{siteClass.maxNights ?? "—"}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Hookups & Features</div>
                  <div className="flex flex-wrap gap-2">
                    {siteClass.hookupsPower && (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3 text-amber-500" /> Power
                      </Badge>
                    )}
                    {siteClass.hookupsWater && (
                      <Badge variant="secondary" className="gap-1">
                        <Droplet className="h-3 w-3 text-blue-500" /> Water
                      </Badge>
                    )}
                    {siteClass.hookupsSewer && (
                      <Badge variant="secondary" className="gap-1">
                        <Waves className="h-3 w-3 text-slate-500" /> Sewer
                      </Badge>
                    )}
                    {siteClass.petFriendly && (
                      <Badge variant="secondary" className="gap-1">
                        <PawPrint className="h-3 w-3 text-amber-600" /> Pet Friendly
                      </Badge>
                    )}
                    {siteClass.accessible && (
                      <Badge variant="secondary" className="gap-1">
                        <Accessibility className="h-3 w-3 text-blue-600" /> Accessible
                      </Badge>
                    )}
                    {!siteClass.hookupsPower && !siteClass.hookupsWater && !siteClass.hookupsSewer && !siteClass.petFriendly && !siteClass.accessible && (
                      <span className="text-muted-foreground text-xs">None configured</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerChild} transition={SPRING_CONFIG}>
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {photoList.length === 0 && <div className="text-sm text-muted-foreground">No photos for this class.</div>}
                {photoList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photoList.map((url) => (
                      <div key={url} className="relative h-24 w-full overflow-hidden rounded-lg border border-border bg-muted">
                        <img src={url} alt="Class photo" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerChild} transition={SPRING_CONFIG}>
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Sites in this class ({sitesInClass.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                {sitesQuery.isLoading && <div className="text-muted-foreground">Loading sites...</div>}
                {sitesQuery.isError && <div className="text-red-500">Failed to load sites</div>}
                {sitesInClass.length === 0 && !sitesQuery.isLoading && (
                  <div className="text-muted-foreground">No sites assigned to this class.</div>
                )}
                {sitesInClass.map((s) => {
                  const status = statusBySite[s.id];
                  return (
                    <div key={s.id} className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground">
                          {s.name || `Site #${s.siteNumber}`}
                        </div>
                        {status ? (
                          <Badge
                            variant={status.status === "available" ? "outline" : "default"}
                            className={cn(
                              "capitalize",
                              status.status === "available" && "border-emerald-500 text-emerald-600"
                            )}
                          >
                            {status.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                      {status?.statusDetail && <div className="text-xs text-muted-foreground">{status.statusDetail}</div>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerChild} transition={SPRING_CONFIG}>
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Upcoming reservations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                {reservationsQuery.isLoading && <div className="text-muted-foreground">Loading reservations...</div>}
                {reservationsQuery.isError && <div className="text-red-500">Failed to load reservations</div>}
                {upcomingReservations.length === 0 && !reservationsQuery.isLoading && (
                  <div className="text-muted-foreground">No upcoming stays for this class.</div>
                )}
                {upcomingReservations.map((res) => (
                  <div key={res.id} className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">
                        {res.guest ? `${res.guest.primaryFirstName} ${res.guest.primaryLastName}` : "Guest"}
                      </div>
                      <Badge variant="outline" className="capitalize">{res.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {res.arrivalDate} → {res.departureDate}
                    </div>
                    {res.site && <div className="text-xs text-muted-foreground">Site: {res.site.name || `#${res.site.siteNumber}`}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={staggerChild} transition={SPRING_CONFIG}>
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Pricing rules affecting this class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {pricingRulesQuery.isLoading && <div className="text-muted-foreground">Loading pricing rules...</div>}
              {pricingRulesQuery.isError && <div className="text-red-500">Failed to load pricing rules</div>}
              {classPricingRules.length === 0 && !pricingRulesQuery.isLoading && (
                <div className="text-muted-foreground">No class-specific rules. Defaults apply.</div>
              )}
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {classPricingRules.slice(0, 6).map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{rule.label || rule.ruleType}</span>
                      <Badge variant={rule.isActive ? "outline" : "secondary"} className="capitalize">
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rule.ruleType === "flat" && rule.flatAdjust != null && `Flat ${rule.flatAdjust / 100 >= 0 ? "+" : "-"}$${Math.abs(rule.flatAdjust / 100).toFixed(2)}`}
                      {rule.ruleType === "percent" && rule.percentAdjust != null && `${rule.percentAdjust}% adjustment`}
                      {rule.ruleType === "seasonal" && `Seasonal ${rule.startDate} → ${rule.endDate || "open"}`}
                      {rule.ruleType === "dow" && rule.dayOfWeek != null && `Day ${rule.dayOfWeek} adjust`}
                    </div>
                  </div>
                ))}
              </div>
              {classPricingRules.length > 6 && (
                <div className="text-sm text-muted-foreground">+ {classPricingRules.length - 6} more rules apply.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerChild} transition={SPRING_CONFIG}>
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {auditLogsQuery.isLoading && <div className="text-muted-foreground">Loading...</div>}
              {auditLogsQuery.isError && <div className="text-red-500">Failed to load activity</div>}
              {classActivity.length === 0 && !auditLogsQuery.isLoading && (
                <div className="text-muted-foreground">No recent changes to this class.</div>
              )}
              {classActivity.map((log: any) => (
                <div key={log.id} className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {log.actor?.email && <div className="text-xs text-muted-foreground">By {log.actor.email}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardShell>
  );
}
