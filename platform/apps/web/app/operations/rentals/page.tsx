"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { useWhoami } from "@/hooks/use-whoami";
import { CalendarDays, ClipboardCheck, Clock3, Plus, RotateCcw, Wrench } from "lucide-react";

type RentalStatus = "available" | "assigned" | "maintenance";
type AvailabilityStatus = "available" | "reserved" | "assigned" | "maintenance";

type RentalItem = {
  id: string;
  name: string;
  type: string;
  rate: number;
  deposit: number;
  status: RentalStatus;
  campgroundId: string;
  assignedTo?: string;
  dueBack?: string;
  notes?: string;
  availability: Record<string, AvailabilityStatus>;
};

const CAMPGROUNDS: { id: string; name: string }[] = [
  { id: "camp-1", name: "Evergreen Bay" },
  { id: "camp-2", name: "Red Rock Ridge" }
];

const dateKey = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const buildAvailability = (statuses: AvailabilityStatus[]) => {
  const map: Record<string, AvailabilityStatus> = {};
  statuses.forEach((status, idx) => {
    map[dateKey(idx)] = status;
  });
  return map;
};

const buildInitialItems = (): RentalItem[] => [
  {
    id: "bike-1",
    name: "Trail Bike A",
    type: "Bike",
    rate: 35,
    deposit: 150,
    status: "assigned",
    campgroundId: "camp-1",
    assignedTo: "Site 18A (Smith)",
    dueBack: dateKey(1),
    notes: "Helmet + lock included",
    availability: buildAvailability(["assigned", "reserved", "reserved", "available", "available", "available", "available"])
  },
  {
    id: "kayak-1",
    name: "Lake Kayak",
    type: "Kayak",
    rate: 55,
    deposit: 200,
    status: "available",
    campgroundId: "camp-1",
    notes: "Life jackets are stored at dock locker 2.",
    availability: buildAvailability(["available", "available", "reserved", "reserved", "available", "available", "available"])
  },
  {
    id: "heater-1",
    name: "Patio Heater",
    type: "Equipment",
    rate: 25,
    deposit: 75,
    status: "maintenance",
    campgroundId: "camp-1",
    notes: "Needs ignition check; spare propane nearby.",
    availability: buildAvailability(["maintenance", "maintenance", "reserved", "available", "available", "available", "available"])
  },
  {
    id: "paddle-1",
    name: "Paddle Board",
    type: "Paddleboard",
    rate: 45,
    deposit: 120,
    status: "available",
    campgroundId: "camp-2",
    availability: buildAvailability(["available", "available", "available", "reserved", "reserved", "available", "available"])
  },
  {
    id: "ebike-1",
    name: "E-Bike Cruiser",
    type: "Bike",
    rate: 65,
    deposit: 250,
    status: "assigned",
    campgroundId: "camp-2",
    assignedTo: "Site 7 (Lopez)",
    dueBack: dateKey(0),
    notes: "Battery at 60%, charger in locker.",
    availability: buildAvailability(["assigned", "reserved", "reserved", "available", "available", "available", "available"])
  }
];

export default function RentalsPage() {
  const { data: whoami, isLoading } = useWhoami();
  const hasMembership = (whoami?.user?.memberships?.length ?? 0) > 0;
  const allowOps = hasMembership && (whoami?.allowed?.operationsWrite ?? false);

  const [campgroundId, setCampgroundId] = useState("camp-1");
  const [items, setItems] = useState<RentalItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("campreserv:rentals:data");
        if (stored) {
          return JSON.parse(stored) as RentalItem[];
        }
      } catch {
        // ignore parse errors, fall back to seed data
      }
    }
    return buildInitialItems();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCg = localStorage.getItem("campreserv:selectedCampground");
    if (storedCg) {
      setCampgroundId(storedCg);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("campreserv:rentals:data", JSON.stringify(items));
  }, [items]);

  const [editOpen, setEditOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
  const [formState, setFormState] = useState<RentalItem>(() => ({
    id: "",
    name: "",
    type: "",
    rate: 0,
    deposit: 0,
    status: "available",
    campgroundId: "camp-1",
    availability: buildAvailability(Array(7).fill("available") as AvailabilityStatus[]),
    notes: ""
  }));
  const [checkoutState, setCheckoutState] = useState<{ id: string; assignedTo: string; dueBack: string }>({
    id: "",
    assignedTo: "",
    dueBack: dateKey(1)
  });

  const scopedItems = useMemo(() => items.filter((item) => item.campgroundId === campgroundId), [items, campgroundId]);
  const upcomingDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, idx) => {
        const key = dateKey(idx);
        const label = new Date(key + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" });
        return { key, label };
      }),
    []
  );

  const summary = useMemo(() => {
    const total = scopedItems.length;
    const assigned = scopedItems.filter((i) => i.status === "assigned").length;
    const maintenance = scopedItems.filter((i) => i.status === "maintenance").length;
    const available = total - assigned - maintenance;
    return { total, assigned, maintenance, available };
  }, [scopedItems]);

  const startCreate = () => {
    setEditingItem(null);
    setFormState({
      id: "",
      name: "",
      type: "",
      rate: 0,
      deposit: 0,
      status: "available",
      campgroundId,
      availability: buildAvailability(Array(7).fill("available") as AvailabilityStatus[]),
      notes: ""
    });
    setEditOpen(true);
  };

  const startEdit = (item: RentalItem) => {
    setEditingItem(item);
    setFormState({ ...item });
    setEditOpen(true);
  };

  const saveItem = () => {
    const payload = { ...formState, id: formState.id || `rental-${Date.now()}` };
    if (editingItem) {
      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? payload : item)));
    } else {
      setItems((prev) => [payload, ...prev]);
    }
    setEditOpen(false);
  };

  const handleCheckout = () => {
    if (!checkoutState.id) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === checkoutState.id
          ? {
              ...item,
              status: "assigned",
              assignedTo: checkoutState.assignedTo || "Assigned (stub)",
              dueBack: checkoutState.dueBack,
              availability: {
                ...item.availability,
                [dateKey(0)]: "assigned",
                [checkoutState.dueBack]: "assigned"
              }
            }
          : item
      )
    );
    setCheckoutOpen(false);
  };

  const handleReturn = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "available",
              assignedTo: undefined,
              dueBack: undefined,
              availability: buildAvailability(Array(7).fill("available") as AvailabilityStatus[])
            }
          : item
      )
    );
  };

  const statusBadge = (status: RentalStatus | AvailabilityStatus) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Available</Badge>;
      case "assigned":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Out</Badge>;
      case "reserved":
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Held</Badge>;
      case "maintenance":
        return <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200">Maintenance</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="p-6 text-slate-600">Checking access…</div>
      </DashboardShell>
    );
  }

  if (!allowOps) {
    return (
      <DashboardShell>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Equipment Rentals</h1>
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-4">
            You do not have permission to view rentals for this account.
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Equipment Rentals</h1>
            <p className="text-slate-600">
              Track rentable gear per campground with quick checkout/return and a simple availability view. Data is stubbed locally.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={campgroundId} onValueChange={(value) => setCampgroundId(value)}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Select campground" />
              </SelectTrigger>
              <SelectContent>
                {CAMPGROUNDS.map((cg) => (
                  <SelectItem key={cg.id} value={cg.id}>
                    {cg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={startCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-xs text-slate-500">Available</div>
                <div className="text-xl font-semibold">{summary.available}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock3 className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-xs text-slate-500">Out / Assigned</div>
                <div className="text-xl font-semibold">{summary.assigned}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Wrench className="h-5 w-5 text-slate-600" />
              <div>
                <div className="text-xs text-slate-500">Maintenance</div>
                <div className="text-xl font-semibold">{summary.maintenance}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CalendarDays className="h-5 w-5 text-sky-600" />
              <div>
                <div className="text-xs text-slate-500">Total Items</div>
                <div className="text-xl font-semibold">{summary.total}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Tabs defaultValue="list">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Rentals</CardTitle>
                <CardDescription>Create/edit items, assign them out, and mark returns.</CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="list">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Deposit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Back</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>${item.rate}/hr</TableCell>
                        <TableCell>${item.deposit}</TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell className="text-sm text-slate-600">{item.assignedTo || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">{item.dueBack ? new Date(item.dueBack + "T00:00:00").toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                            Edit
                          </Button>
                          {item.status === "assigned" ? (
                            <Button variant="secondary" size="sm" onClick={() => handleReturn(item.id)}>
                              <RotateCcw className="mr-1 h-4 w-4" />
                              Return
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setCheckoutState({
                                  id: item.id,
                                  assignedTo: "",
                                  dueBack: dateKey(1)
                                });
                                setCheckoutOpen(true);
                              }}
                            >
                              Checkout
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {scopedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-6 text-center text-slate-500">
                          No rental items for this campground yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="calendar">
                <div className="space-y-3">
                  {scopedItems.map((item) => (
                    <Card key={`cal-${item.id}`} className="border-slate-200">
                      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription>
                            {item.type} • ${item.rate}/hr • Deposit ${item.deposit}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">{statusBadge(item.status)}</div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                          {upcomingDays.map((day) => {
                            const dayStatus = item.availability[day.key] || "available";
                            return (
                              <div
                                key={`${item.id}-${day.key}`}
                                className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm"
                              >
                                <div className="text-xs text-slate-500">{day.label}</div>
                                <div className="mt-1">{statusBadge(dayStatus)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {scopedItems.length === 0 && (
                    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                      Add a rental item to see the calendar view.
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit rental item" : "New rental item"}</DialogTitle>
            <DialogDescription>Stubbed data only; no external systems are called.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="Type (bike, kayak, etc.)" value={formState.type} onChange={(e) => setFormState({ ...formState, type: e.target.value })} />
              <Select value={formState.status} onValueChange={(value) => setFormState({ ...formState, status: value as RentalStatus })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                type="number"
                min={0}
                placeholder="Hourly rate"
                value={formState.rate}
                onChange={(e) => setFormState({ ...formState, rate: Number(e.target.value) })}
              />
              <Input
                type="number"
                min={0}
                placeholder="Deposit"
                value={formState.deposit}
                onChange={(e) => setFormState({ ...formState, deposit: Number(e.target.value) })}
              />
            </div>
            <Select value={formState.campgroundId} onValueChange={(value) => setFormState({ ...formState, campgroundId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Campground" />
              </SelectTrigger>
              <SelectContent>
                {CAMPGROUNDS.map((cg) => (
                  <SelectItem key={`edit-${cg.id}`} value={cg.id}>
                    {cg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Notes (where it's stored, accessories, maintenance notes)"
              value={formState.notes || ""}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
            />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem}>{editingItem ? "Save changes" : "Create item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stub checkout</DialogTitle>
            <DialogDescription>Assign this item to a guest or site and set an expected return.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Assigned to (guest, site, reservation)"
              value={checkoutState.assignedTo}
              onChange={(e) => setCheckoutState({ ...checkoutState, assignedTo: e.target.value })}
            />
            <Input type="date" value={checkoutState.dueBack} onChange={(e) => setCheckoutState({ ...checkoutState, dueBack: e.target.value })} />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout}>Mark assigned</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

