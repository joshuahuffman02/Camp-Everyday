"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, LogOut, Loader2, MessageCircle, Gift, CalendarDays, Clock, Flame, Sparkles, Trees } from "lucide-react";
import { addDays, differenceInCalendarDays, format, isWithinInterval } from "date-fns";
import { GuestChatPanel } from "@/components/portal/GuestChatPanel";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { loadQueue as loadQueueGeneric, saveQueue as saveQueueGeneric, registerBackgroundSync } from "@/lib/offline-queue";
import { randomId } from "@/lib/random-id";

// Define local types until we have shared types fully integrated
type GuestData = {
    id: string;
    primaryFirstName: string;
    primaryLastName: string;
    email: string;
    reservations: Array<{
        id: string;
        arrivalDate: string;
        departureDate: string;
        status: string;
        adults: number;
        children: number;
        campground: {
            name: string;
            slug: string;
            heroImageUrl: string | null;
            amenities: string[];
            checkInTime: string | null;
            checkOutTime: string | null;
        };
        site: {
            name: string;
            siteNumber: string;
            siteType: string;
        };
    }>;
};

type UpsellOption = {
    id: string;
    title: string;
    description: string;
    priceCents: number;
    type: "service" | "product" | "activity";
    windowLabel: string;
    availableFrom: Date;
    availableTo: Date;
    slots?: number;
};

const buildUpsellDate = (date: Date, hour: number, minute = 0) => {
    const next = new Date(date);
    next.setHours(hour, minute, 0, 0);
    return next;
};

const buildUpsellsForStay = (reservation: GuestData["reservations"][0]): UpsellOption[] => {
    const arrival = new Date(reservation.arrivalDate);
    const departure = new Date(reservation.departureDate);
    const stayWindow = { start: arrival, end: buildUpsellDate(departure, 23, 59) };
    const nights = Math.max(1, differenceInCalendarDays(departure, arrival));

    const lateCheckoutDay = buildUpsellDate(departure, 13); // 1:00 PM checkout
    const firewoodWindowStart = buildUpsellDate(arrival, 16);
    const firewoodWindowEnd = buildUpsellDate(addDays(arrival, Math.max(0, nights - 1)), 20);

    const activitySlots = [
        {
            id: "sunset-paddle",
            title: "Sunset paddle + s'mores kit",
            startsAt: buildUpsellDate(addDays(arrival, Math.min(1, nights - 1)), 17),
            priceCents: 3500,
            slots: 6,
            icon: "activity" as const,
        },
        {
            id: "guided-hike",
            title: "Guided nature walk",
            startsAt: buildUpsellDate(addDays(arrival, Math.min(2, nights - 1)), 9),
            priceCents: 2500,
            slots: 8,
            icon: "activity" as const,
        },
    ];

    const options: UpsellOption[] = [
        {
            id: "late-checkout",
            title: "Late checkout",
            description: "Sleep in and head out at 1:00 PM if the next site is clear.",
            priceCents: 2000,
            type: "service",
            windowLabel: `Departure ${format(departure, "EEE, MMM d")}`,
            availableFrom: lateCheckoutDay,
            availableTo: lateCheckoutDay,
        },
        {
            id: "firewood-bundle",
            title: "Firewood bundle + starter",
            description: "Have a bundle delivered to your site before dusk.",
            priceCents: 1200,
            type: "product",
            windowLabel: `${format(firewoodWindowStart, "EEE")} after ${format(firewoodWindowStart, "h:mm a")}`,
            availableFrom: firewoodWindowStart,
            availableTo: firewoodWindowEnd,
        },
        ...activitySlots
            .filter((slot) => isWithinInterval(slot.startsAt, stayWindow))
            .map((slot) => ({
                id: slot.id,
                title: slot.title,
                description: "Reserve a spot while availability lasts.",
                priceCents: slot.priceCents,
                type: "activity" as const,
                windowLabel: `${format(slot.startsAt, "EEE h:mm a")} • ${slot.slots} spots left`,
                availableFrom: slot.startsAt,
                availableTo: slot.startsAt,
                slots: slot.slots,
            })),
    ];

    return options.filter((option) =>
        isWithinInterval(option.availableFrom, stayWindow)
    );
};

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function MyStayPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [guest, setGuest] = useState<GuestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<Record<string, { name: string; priceCents: number; qty: number }>>({});
    const [orderLoading, setOrderLoading] = useState(false);
    const [queuedUpsells, setQueuedUpsells] = useState(0);

    useEffect(() => {
        const storedToken = localStorage.getItem("campreserv:guestToken");
        if (!storedToken) {
            router.push("/portal/login");
            return;
        }
        setToken(storedToken);

        const fetchGuest = async () => {
            try {
                const data = await apiClient.getGuestMe(storedToken);
                // @ts-ignore - zod schema might need adjustment for dates vs strings
                setGuest(data);
            } catch (err) {
                console.error(err);
                // If auth fails, clear token and redirect
                localStorage.removeItem("campreserv:guestToken");
                router.push("/portal/login");
            } finally {
                setLoading(false);
            }
        };

        fetchGuest();
    }, [router]);

    const now = new Date();
    const upcoming = (guest?.reservations ?? []).filter(
        (r) => new Date(r.departureDate) >= now
    ).sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());

    const past = (guest?.reservations ?? []).filter(
        (r) => new Date(r.departureDate) < now
    ).sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());

    const currentReservation = upcoming[0];
    const upsellQueueKey = currentReservation ? `campreserv:portal:upsells:${currentReservation.campground.slug}` : null;
    const targetedUpsells = useMemo(() => currentReservation ? buildUpsellsForStay(currentReservation) : [], [currentReservation]);

    useEffect(() => {
        if (!upsellQueueKey) return;
        const existing = loadQueueGeneric<any>(upsellQueueKey);
        setQueuedUpsells(existing.length);
    }, [upsellQueueKey]);

    useEffect(() => {
        const loadEvents = async () => {
            if (!token || !currentReservation) return;
            setEventsLoading(true);
            try {
                const start = currentReservation.arrivalDate;
                const end = currentReservation.departureDate;
                const data = await apiClient.getPublicEvents(token, currentReservation.campground.slug, start, end);
                setEvents(data);
            } catch (err) {
                console.error("Failed to load events", err);
                setEvents([]);
            } finally {
                setEventsLoading(false);
            }
        };
        loadEvents();
    }, [token, currentReservation]);

    useEffect(() => {
        const loadProducts = async () => {
            if (!token || !currentReservation) return;
            try {
                const data = await apiClient.getPortalProducts(token, currentReservation.campground.slug);
                setProducts(data);
            } catch (err) {
                console.error("Failed to load products", err);
                setProducts([]);
            }
        };
        loadProducts();
    }, [token, currentReservation]);

    const handleLogout = () => {
        localStorage.removeItem("campreserv:guestToken");
        router.push("/portal/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!guest) return null;

    const cartItems = Object.entries(cart).map(([id, item]) => ({ id, ...item }));
    const cartTotalCents = cartItems.reduce((sum, item) => sum + item.priceCents * item.qty, 0);

    const updateCart = (id: string, name: string, priceCents: number, delta: number) => {
        setCart(prev => {
            const next = { ...prev };
            const existing = next[id];
            const newQty = (existing?.qty || 0) + delta;
            if (newQty <= 0) {
                delete next[id];
            } else {
                next[id] = { name, priceCents, qty: newQty };
            }
            return next;
        });
    };

    const handleQueueUpsell = (upsell: UpsellOption) => {
        if (!upsellQueueKey || !currentReservation) return;
        const payload = {
            id: randomId(),
            reservationId: currentReservation.id,
            campgroundSlug: currentReservation.campground.slug,
            upsellId: upsell.id,
            title: upsell.title,
            priceCents: upsell.priceCents,
            queuedAt: new Date().toISOString(),
        };
        const existing = loadQueueGeneric<any>(upsellQueueKey);
        const next = [...existing, payload];
        saveQueueGeneric(upsellQueueKey, next);
        setQueuedUpsells(next.length);
        void registerBackgroundSync();
        toast({
            title: "Added to stay",
            description: `${upsell.title} queued. We'll sync it to your reservation.`,
        });
    };

    const placeOrder = async () => {
        if (!token || !currentReservation || cartItems.length === 0) return;
        setOrderLoading(true);
        try {
            await apiClient.createPortalOrder(token, {
                reservationId: currentReservation.id,
                items: cartItems.map((item) => ({ productId: item.id, qty: item.qty }))
            });
            setCart({});
        } catch (err) {
            console.error("Order failed", err);
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="font-bold text-xl">My Stay</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden sm:inline-block">
                            Welcome, {guest.primaryFirstName}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => router.push("/portal/rewards")}>
                            <Gift className="h-4 w-4 mr-2" />
                            Rewards
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {!currentReservation ? (
                    <Card>
                        <CardContent className="py-10 text-center space-y-4">
                            <p className="text-muted-foreground">You don't have any upcoming reservations.</p>
                            <Button onClick={() => window.location.href = '/'}>Book a Stay</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Hero Section */}
                        <div className="relative rounded-xl overflow-hidden h-48 md:h-64 bg-slate-900">
                            {currentReservation.campground.heroImageUrl && (
                                <img
                                    src={currentReservation.campground.heroImageUrl}
                                    alt={currentReservation.campground.name}
                                    className="w-full h-full object-cover opacity-60"
                                />
                            )}
                            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                                <Badge
                                    className={`w-fit mb-2 ${currentReservation.status === 'checked_in'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                >
                                    {currentReservation.status === 'checked_in' ? 'Checked In' : 'Upcoming Stay'}
                                </Badge>
                                <h2 className="text-3xl font-bold">{currentReservation.campground.name}</h2>
                                <div className="flex items-center gap-2 mt-1 text-slate-200">
                                    <MapPin className="h-4 w-4" />
                                    <span>Site {currentReservation.site.siteNumber} ({currentReservation.site.name})</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs for Stay Details, Events, and Messages */}
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full max-w-xl grid-cols-3">
                                <TabsTrigger value="details">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Stay Details
                                </TabsTrigger>
                                <TabsTrigger value="events">
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Events
                                </TabsTrigger>
                                <TabsTrigger value="messages">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Messages
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="mt-6">
                                <div className="grid md:grid-cols-3 gap-6">
                                    {/* Main Info */}
                                    <div className="md:col-span-2 space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Reservation Details</CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Dates</span>
                                                    </div>
                                                    <p className="font-semibold">
                                                        {format(new Date(currentReservation.arrivalDate), "MMM d")} -{" "}
                                                        {format(new Date(currentReservation.departureDate), "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Check-in: {currentReservation.campground.checkInTime || "3:00 PM"}
                                                        <br />
                                                        Check-out: {currentReservation.campground.checkOutTime || "11:00 AM"}
                                                    </p>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <Users className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Guests</span>
                                                    </div>
                                                    <p className="font-semibold">
                                                        {currentReservation.adults} Adults, {currentReservation.children} Children
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Campground Amenities</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentReservation.campground.amenities.map((amenity) => (
                                                        <Badge key={amenity} variant="secondary">
                                                            {amenity}
                                                        </Badge>
                                                    ))}
                                                    {currentReservation.campground.amenities.length === 0 && (
                                                        <p className="text-muted-foreground text-sm">No amenities listed.</p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                                        <CardTitle>Suggested add-ons</CardTitle>
                                                    </div>
                                                    <CardDescription>
                                                        Based on your dates at {currentReservation.campground.name}
                                                    </CardDescription>
                                                </div>
                                                {queuedUpsells > 0 && (
                                                    <Badge variant="secondary">{queuedUpsells} queued</Badge>
                                                )}
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {targetedUpsells.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        No upsells match your stay right now. Check back closer to arrival.
                                                    </p>
                                                ) : (
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {targetedUpsells.map((upsell) => {
                                                            const typeLabel = upsell.type === "service"
                                                                ? "Service"
                                                                : upsell.type === "product"
                                                                    ? "Item"
                                                                    : "Activity";
                                                            const Icon = upsell.type === "service" ? Clock : upsell.type === "product" ? Flame : Trees;
                                                            return (
                                                                <div key={upsell.id} className="border rounded-lg p-3 bg-white/60 shadow-sm space-y-2">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <Icon className="h-4 w-4 text-primary" />
                                                                                <span className="font-semibold leading-tight">{upsell.title}</span>
                                                                            </div>
                                                                            <p className="text-sm text-muted-foreground">{upsell.description}</p>
                                                                        </div>
                                                                        <Badge variant="outline">{typeLabel}</Badge>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="font-semibold">{formatPrice(upsell.priceCents)}</span>
                                                                        <span className="text-muted-foreground">{upsell.windowLabel}</span>
                                                                    </div>
                                                                    <Button size="sm" variant="secondary" className="w-full" onClick={() => handleQueueUpsell(upsell)}>
                                                                        Add to stay
                                                                    </Button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Adds are queued locally per campground and sync when connectivity is back.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Sidebar Actions */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Order to Your Site</CardTitle>
                                                <CardDescription>Charge to your reservation</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {products.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">No items available.</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-64 overflow-auto">
                                                        {products.map((p) => (
                                                            <div key={p.id} className="flex items-center justify-between gap-2 border rounded px-2 py-2">
                                                                <div>
                                                                    <div className="text-sm font-medium">{p.name}</div>
                                                                    <div className="text-xs text-muted-foreground">${(p.priceCents / 100).toFixed(2)}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button size="icon" variant="outline" onClick={() => updateCart(p.id, p.name, p.priceCents, -1)}>-</Button>
                                                                    <span className="w-6 text-center text-sm">{cart[p.id]?.qty || 0}</span>
                                                                    <Button size="icon" variant="outline" onClick={() => updateCart(p.id, p.name, p.priceCents, 1)}>+</Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <Separator />
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>Cart Total</span>
                                                    <span className="font-semibold">${(cartTotalCents / 100).toFixed(2)}</span>
                                                </div>
                                                <Button className="w-full" onClick={placeOrder} disabled={cartItems.length === 0 || orderLoading}>
                                                    {orderLoading ? "Placing..." : "Place Order"}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="events" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Events During Your Stay</CardTitle>
                                        <CardDescription>
                                            {eventsLoading ? "Loading events..." : events.length === 0 ? "No events scheduled for your dates." : null}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {eventsLoading ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : events.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Nothing scheduled during your stay. Check back later!</p>
                                        ) : (
                                            events.map((event) => (
                                                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                                    <div className="p-2 rounded bg-emerald-50">
                                                        <Clock className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold">{event.title || "Event"}</span>
                                                            {event.category && <Badge variant="outline">{event.category}</Badge>}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {format(new Date(event.startTime), "EEE, MMM d • h:mm a")}
                                                            {event.endTime ? ` - ${format(new Date(event.endTime), "h:mm a")}` : ""}
                                                        </div>
                                                        {event.location && (
                                                            <div className="text-xs text-muted-foreground">Location: {event.location}</div>
                                                        )}
                                                        {event.description && (
                                                            <div className="text-sm text-slate-700">{event.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="messages" className="mt-6">
                                {token && (
                                    <GuestChatPanel
                                        reservationId={currentReservation.id}
                                        token={token}
                                    />
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}

                {/* Past Reservations */}
                {past.length > 0 && (
                    <div className="space-y-4 pt-8 border-t">
                        <h3 className="text-lg font-semibold">Past Stays</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {past.map((reservation) => (
                                <Card key={reservation.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{reservation.campground.name}</CardTitle>
                                        <CardDescription>
                                            {format(new Date(reservation.arrivalDate), "MMM d, yyyy")}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground">
                                            <p>Site {reservation.site.siteNumber}</p>
                                            <p>{reservation.adults} Guests</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
