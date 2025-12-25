// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";
import { apiClient } from "../../lib/api-client";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Plus, Calendar, Clock, Users, DollarSign, Trash2, AlertTriangle, LayoutGrid, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../components/ui/use-toast";
import { Badge } from "../../components/ui/badge";
import { TableEmpty } from "../../components/ui/table";
import { Switch } from "../../components/ui/switch";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CreateEventDialog } from "../../components/events/CreateEventDialog";
import { Event } from "@campreserv/shared";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

type ActivityRecord = {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    duration: number;
    capacity: number;
    isActive: boolean;
};

type CapacitySnapshot = {
    activityId: string;
    capacity: number;
    booked: number;
    remaining: number;
    waitlistEnabled: boolean;
    waitlistCount: number;
    overage: boolean;
    overageAmount: number;
    lastUpdated: string;
};

type ActivityCardProps = {
    activity: ActivityRecord;
    onManageSessions: (id: string) => void;
    onDelete: (id: string) => void;
};

function ActivityCard({ activity, onManageSessions, onDelete }: ActivityCardProps) {
    const { toast } = useToast();
    const [capacityInput, setCapacityInput] = useState("");
    const [waitlistName, setWaitlistName] = useState("");
    const [waitlistContact, setWaitlistContact] = useState("");
    const [waitlistPartySize, setWaitlistPartySize] = useState("2");

    const capacityQuery = useQuery<CapacitySnapshot>({
        queryKey: ["activityCapacity", activity.id],
        queryFn: () => apiClient.getActivityCapacity(activity.id),
    });

    useEffect(() => {
        if (capacityQuery.data) {
            setCapacityInput(capacityQuery.data.capacity.toString());
        }
    }, [capacityQuery.data]);

    const updateCapacity = useMutation({
        mutationFn: (payload: Partial<CapacitySnapshot>) => apiClient.updateActivityCapacity(activity.id, payload),
        onSuccess: (snapshot) => {
            setCapacityInput(snapshot.capacity.toString());
            toast({
                title: "Capacity updated",
                description: snapshot.overage
                    ? `Overage alert: over by ${snapshot.overageAmount}`
                    : `Remaining spots: ${snapshot.remaining}`,
            });
            capacityQuery.refetch();
        },
        onError: () => toast({ title: "Failed to update capacity", variant: "destructive" }),
    });

    const addWaitlist = useMutation({
        mutationFn: () =>
            apiClient.addActivityWaitlistEntry(activity.id, {
                guestName: waitlistName || "Walk-up guest",
                contact: waitlistContact || undefined,
                partySize: parseInt(waitlistPartySize || "1", 10),
            }),
        onSuccess: () => {
            toast({ title: "Added to waitlist" });
            setWaitlistName("");
            setWaitlistContact("");
            setWaitlistPartySize("2");
            capacityQuery.refetch();
        },
        onError: (err: any) => {
            toast({ title: err?.message || "Waitlist add failed", variant: "destructive" });
        },
    });

    const snapshot = capacityQuery.data;

    return (
        <Card key={activity.id}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{activity.name}</CardTitle>
                    <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {activity.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
                <CardDescription className="line-clamp-2">
                    {activity.description || "No description"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>${(activity.price / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{activity.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Max {activity.capacity}</span>
                    </div>
                </div>

                <div className="rounded-lg border p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="font-medium">
                            {snapshot ? `${snapshot.remaining} remaining of ${snapshot.capacity}` : "Loading capacity..."}
                        </div>
                        {snapshot && (
                            <span className="rounded-full border px-2 py-1 text-[11px] font-semibold text-slate-700">
                                {snapshot.overage ? `Over by ${snapshot.overageAmount}` : "Within cap"}
                            </span>
                        )}
                    </div>

                    {snapshot?.overage && null}

                    <div className="grid grid-cols-2 gap-3 items-end">
                        <div className="grid gap-2">
                            <Label>Capacity</Label>
                            <Input
                                type="number"
                                value={capacityInput}
                                onChange={(e) => setCapacityInput(e.target.value)}
                                placeholder="Capacity"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={snapshot?.waitlistEnabled ?? false}
                                onCheckedChange={(checked) => updateCapacity.mutate({ waitlistEnabled: checked })}
                                disabled={updateCapacity.isPending}
                            />
                            <div className="text-sm">
                                <div className="font-medium">Waitlist</div>
                                <div className="text-slate-500">{snapshot?.waitlistCount || 0} on list</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => capacityQuery.refetch()}
                            disabled={capacityQuery.isFetching}
                        >
                            Refresh
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => updateCapacity.mutate({ capacity: parseInt(capacityInput || "0", 10) })}
                            disabled={!capacityInput || updateCapacity.isPending}
                        >
                            {updateCapacity.isPending ? "Saving..." : "Save cap"}
                        </Button>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Add to waitlist</Label>
                            <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold text-slate-700">Optional stub</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                placeholder="Guest name"
                                value={waitlistName}
                                onChange={(e) => setWaitlistName(e.target.value)}
                                disabled={!snapshot?.waitlistEnabled}
                            />
                            <Input
                                placeholder="Contact (email/phone)"
                                value={waitlistContact}
                                onChange={(e) => setWaitlistContact(e.target.value)}
                                disabled={!snapshot?.waitlistEnabled}
                            />
                            <Input
                                type="number"
                                min={1}
                                placeholder="Party size"
                                value={waitlistPartySize}
                                onChange={(e) => setWaitlistPartySize(e.target.value)}
                                disabled={!snapshot?.waitlistEnabled}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => addWaitlist.mutate()}
                                disabled={!snapshot?.waitlistEnabled || addWaitlist.isPending}
                            >
                                {addWaitlist.isPending ? "Adding..." : "Add to waitlist"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" className="flex-1" onClick={() => onManageSessions(activity.id)}>
                        Manage Sessions
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                            if (confirm("Delete this activity?")) {
                                onDelete(activity.id);
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ActivitiesPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [newActivity, setNewActivity] = useState({
        name: "",
        description: "",
        price: "",
        duration: "",
        capacity: ""
    });

    const [selectedActivityForSessions, setSelectedActivityForSessions] = useState<string | null>(null);
    const [newSession, setNewSession] = useState({
        startTime: "",
        endTime: "",
        capacity: ""
    });

    // Get campground ID from localStorage
    const [campgroundId, setCampgroundId] = useState<string>("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("campreserv:selectedCampground");
        if (stored) setCampgroundId(stored);
    }, []);

    const { data: activities, isLoading } = useQuery({
        queryKey: ["activities", campgroundId],
        queryFn: () => apiClient.getActivities(campgroundId),
        enabled: !!campgroundId
    });

    const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ["events", campgroundId],
        queryFn: () => apiClient.getEvents(campgroundId),
        enabled: !!campgroundId && viewMode === "calendar"
    });

    const { data: sessions, refetch: refetchSessions } = useQuery({
        queryKey: ["sessions", selectedActivityForSessions],
        queryFn: () => selectedActivityForSessions ? apiClient.getSessions(selectedActivityForSessions) : Promise.resolve([]),
        enabled: !!selectedActivityForSessions
    });

    const createSessionMutation = useMutation({
        mutationFn: async () => {
            if (!selectedActivityForSessions) throw new Error("No activity selected");
            return apiClient.createSession(selectedActivityForSessions, {
                startTime: new Date(newSession.startTime).toISOString(),
                endTime: new Date(newSession.endTime).toISOString(),
                capacity: newSession.capacity ? parseInt(newSession.capacity) : undefined
            });
        },
        onSuccess: () => {
            refetchSessions();
            setNewSession({ startTime: "", endTime: "", capacity: "" });
            toast({ title: "Session scheduled" });
        },
        onError: () => {
            toast({ title: "Failed to schedule session", variant: "destructive" });
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            return apiClient.createActivity(campgroundId, {
                ...newActivity,
                price: parseFloat(newActivity.price) * 100, // Convert to cents
                duration: parseInt(newActivity.duration),
                capacity: parseInt(newActivity.capacity)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities", campgroundId] });
            setIsCreateOpen(false);
            setNewActivity({ name: "", description: "", price: "", duration: "", capacity: "" });
            toast({ title: "Activity created" });
        },
        onError: () => {
            toast({ title: "Failed to create activity", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.deleteActivity(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities", campgroundId] });
            toast({ title: "Activity deleted" });
        }
    });

    const selectedActivity = activities?.find((a) => a.id === selectedActivityForSessions);

    const handleDelete = (id: string) => {
        if (confirm("Delete this activity?")) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <DashboardShell>
                <div className="flex items-center justify-center h-96">Loading activities...</div>
            </DashboardShell>
        );
    }

    // ... (rest of the component)

    const calendarEvents = events?.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startDate),
        end: event.endDate ? new Date(event.endDate) : new Date(event.startDate),
        allDay: event.isAllDay,
        resource: event
    })) || [];

    const handleSelectEvent = (event: any) => {
        // TODO: Open edit dialog
        console.log("Selected event:", event);
    };

    return (
        <DashboardShell>
            {/* Session Management Dialog */}
            <Dialog open={!!selectedActivityForSessions} onOpenChange={(open) => !open && setSelectedActivityForSessions(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Manage Sessions {selectedActivity ? `– ${selectedActivity.name}` : ""}</DialogTitle>
                        <DialogDescription>Schedule upcoming sessions for this activity.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                            <h4 className="font-medium text-sm">Schedule New Session</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={newSession.startTime}
                                        onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>End Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={newSession.endTime}
                                        onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Capacity (Optional)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Override default"
                                        value={newSession.capacity}
                                        onChange={(e) => setNewSession({ ...newSession, capacity: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button size="sm" onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending || !newSession.startTime || !newSession.endTime}>
                                {createSessionMutation.isPending ? "Scheduling..." : "Add Session"}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Upcoming Sessions</h4>
                            <div className="border rounded-lg divide-y">
                                {sessions?.map((session) => (
                                    <div key={session.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">
                                                {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {session.bookedCount} / {session.capacity} booked
                                            </div>
                                        </div>
                                        <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                            {session.status}
                                        </span>
                                    </div>
                                ))}
                                {sessions?.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">No sessions scheduled.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Activity Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Activity</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={newActivity.name}
                                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                                placeholder="e.g. Morning Yoga"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newActivity.description}
                                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                placeholder="Activity details..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Price ($)</Label>
                                <Input
                                    type="number"
                                    value={newActivity.price}
                                    onChange={(e) => setNewActivity({ ...newActivity, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Duration (mins)</Label>
                                <Input
                                    type="number"
                                    value={newActivity.duration}
                                    onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                                    placeholder="60"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Capacity (people)</Label>
                            <Input
                                type="number"
                                value={newActivity.capacity}
                                onChange={(e) => setNewActivity({ ...newActivity, capacity: e.target.value })}
                                placeholder="20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Creating..." : "Create Activity"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Event Dialog */}
            <CreateEventDialog
                open={isCreateEventOpen}
                onOpenChange={setIsCreateEventOpen}
                campgroundId={campgroundId}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["events", campgroundId] });
                }}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Activities & Facilities</h1>
                        <p className="text-slate-500">Manage guided tours, rentals, and facility bookings.</p>
                    </div>
                    <Button onClick={() => viewMode === "cards" ? setIsCreateOpen(true) : setIsCreateEventOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {viewMode === "cards" ? "New Activity" : "Add Event"}
                    </Button>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setViewMode("cards")}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                            viewMode === "cards"
                                ? "border-slate-900 text-slate-900 font-medium"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Cards
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                            viewMode === "calendar"
                                ? "border-slate-900 text-slate-900 font-medium"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Calendar
                    </button>
                </div>

                {/* Cards View */}
                {viewMode === "cards" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities?.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onManageSessions={setSelectedActivityForSessions}
                                onDelete={handleDelete}
                            />
                        ))}
                        {activities?.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                                  <table className="w-full text-sm">
                                    <tbody>
                                      <TableEmpty>No activities yet</TableEmpty>
                                    </tbody>
                                  </table>
                                </div>
                                <p className="text-slate-500">Create your first activity to get started.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Calendar View */}
                {viewMode === "calendar" && (
                    <div className="bg-white rounded-lg shadow p-4" style={{ height: "600px" }}>
                        {eventsLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                            </div>
                        ) : (
                            <BigCalendar
                                localizer={localizer}
                                events={calendarEvents}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: "100%" }}
                                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                                defaultView={Views.MONTH}
                                onSelectEvent={handleSelectEvent}
                            />
                        )}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
