"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { apiClient } from "@/lib/api-client";
import { Event } from "@campreserv/shared";
import { Plus, Loader2 } from "lucide-react";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { useToast } from "@/components/ui/use-toast";

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

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { toast } = useToast();

    // TODO: Get from context or URL
    const campgroundId = "default-campground-id";

    useEffect(() => {
        // Try to get campground ID from local storage if available, similar to other pages
        const stored = localStorage.getItem("campreserv:selectedCampground");
        if (stored) {
            loadEvents(stored);
        } else {
            // Fallback or redirect? For now just load with default or empty
            loadEvents(campgroundId);
        }
    }, []);

    const loadEvents = async (cgId: string) => {
        try {
            setLoading(true);
            const data = await apiClient.getEvents(cgId);
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events:", error);
            toast({
                title: "Error",
                description: "Failed to load events.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const calendarEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startDate),
        end: event.endDate ? new Date(event.endDate) : new Date(event.startDate),
        allDay: event.isAllDay,
        resource: event
    }));

    const handleSelectEvent = (event: any) => {
        // TODO: Open edit dialog
        console.log("Selected event:", event);
    };

    return (
        <DashboardShell>
            <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Events Calendar</h1>
                        <p className="text-muted-foreground">Manage activities and events for your campground.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                    </Button>
                </div>

                <div className="flex-1 bg-white rounded-lg shadow p-4">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                        </div>
                    ) : (
                        <Calendar
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

                <CreateEventDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    campgroundId={campgroundId} // This should be dynamic
                    onSuccess={() => {
                        const stored = localStorage.getItem("campreserv:selectedCampground");
                        loadEvents(stored || campgroundId);
                    }}
                />
            </div>
        </DashboardShell>
    );
}
