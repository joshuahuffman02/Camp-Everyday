"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

interface Reservation {
  id: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  adults: number;
  children: number;
  totalCents: number;
  paidCents: number;
  campground: {
    name: string;
    slug: string;
  };
  site: {
    siteNumber: string;
  };
}

interface GuestData {
  id: string;
  primaryFirstName: string;
  primaryLastName: string;
  email: string;
  reservations: Reservation[];
}

type ActionType = "modify-dates" | "change-site" | "add-guest" | "cancel" | "pay-balance" | null;

export default function PortalManagePage() {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("guestPortalToken");
    if (!storedToken) {
      router.replace("/portal/login");
      return;
    }
    setToken(storedToken);
    fetchGuest(storedToken);
  }, []);

  const fetchGuest = async (t: string) => {
    try {
      const data = await apiClient.getPortalGuest(t);
      setGuest(data);
      if (data.reservations.length > 0) {
        setSelectedReservation(data.reservations[0]);
      }
    } catch {
      router.replace("/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!guest || !selectedReservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg mb-4">No reservations found</p>
          <Link href="/portal/login" className="text-emerald-400 hover:text-emerald-300">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const balanceDue = selectedReservation.totalCents - selectedReservation.paidCents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <Link href="/portal/my-stay" className="text-emerald-400 hover:text-emerald-300 text-sm">
          ← Back to My Stay
        </Link>
        <h1 className="font-semibold">Manage Reservation</h1>
        <div />
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Reservation Selection */}
        {guest.reservations.length > 1 && (
          <div className="bg-white/5 rounded-xl p-4">
            <label className="block text-sm text-slate-400 mb-2">Select Reservation</label>
            <select
              value={selectedReservation.id}
              onChange={(e) =>
                setSelectedReservation(guest.reservations.find((r) => r.id === e.target.value)!)
              }
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
            >
              {guest.reservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.campground.name} - Site {r.site.siteNumber} ({formatDate(r.arrivalDate)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Reservation Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedReservation.campground.name}</h2>
              <p className="text-slate-400">Site {selectedReservation.site.siteNumber}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedReservation.status === "confirmed"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : selectedReservation.status === "checked_in"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-slate-500/20 text-slate-300"
              }`}
            >
              {selectedReservation.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Check-in</p>
              <p className="font-medium">{formatDate(selectedReservation.arrivalDate)}</p>
            </div>
            <div>
              <p className="text-slate-400">Check-out</p>
              <p className="font-medium">{formatDate(selectedReservation.departureDate)}</p>
            </div>
            <div>
              <p className="text-slate-400">Guests</p>
              <p className="font-medium">
                {selectedReservation.adults} adults
                {selectedReservation.children > 0 && `, ${selectedReservation.children} children`}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Balance Due</p>
              <p className={`font-medium ${balanceDue > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {balanceDue > 0 ? `$${(balanceDue / 100).toFixed(2)}` : "Paid"}
              </p>
            </div>
          </div>
        </div>

        {/* Self-Service Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">What would you like to do?</h3>

          <ActionButton
            icon="📅"
            title="Modify Dates"
            description="Change your check-in or check-out dates"
            onClick={() => setActiveAction("modify-dates")}
            disabled={selectedReservation.status === "checked_in"}
          />

          <ActionButton
            icon="🏕️"
            title="Change Site"
            description="Request a different campsite"
            onClick={() => setActiveAction("change-site")}
            disabled={selectedReservation.status === "checked_in"}
          />

          <ActionButton
            icon="👥"
            title="Add/Remove Guests"
            description="Update your party size"
            onClick={() => setActiveAction("add-guest")}
          />

          {balanceDue > 0 && (
            <ActionButton
              icon="💳"
              title="Pay Balance"
              description={`Pay your outstanding balance of $${(balanceDue / 100).toFixed(2)}`}
              onClick={() => setActiveAction("pay-balance")}
              highlight
            />
          )}

          <ActionButton
            icon="❌"
            title="Cancel Reservation"
            description="Cancel your reservation (fees may apply)"
            onClick={() => setActiveAction("cancel")}
            danger
            disabled={selectedReservation.status === "checked_in"}
          />
        </div>

        {/* Action Modals */}
        {activeAction && (
          <ActionModal
            action={activeAction}
            reservation={selectedReservation}
            token={token!}
            onClose={() => setActiveAction(null)}
            onSuccess={() => {
              setActiveAction(null);
              fetchGuest(token!);
            }}
          />
        )}
      </main>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  description,
  onClick,
  disabled,
  highlight,
  danger,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-xl text-left transition-all ${
        disabled
          ? "bg-slate-800/30 text-slate-500 cursor-not-allowed"
          : danger
          ? "bg-red-900/20 hover:bg-red-900/30 border border-red-800/30"
          : highlight
          ? "bg-emerald-900/30 hover:bg-emerald-900/40 border border-emerald-700/30"
          : "bg-white/5 hover:bg-white/10 border border-white/10"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
    </button>
  );
}

function ActionModal({
  action,
  reservation,
  token,
  onClose,
  onSuccess,
}: {
  action: ActionType;
  reservation: Reservation;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [newArrival, setNewArrival] = useState(reservation.arrivalDate.split("T")[0]);
  const [newDeparture, setNewDeparture] = useState(reservation.departureDate.split("T")[0]);
  const [adults, setAdults] = useState(reservation.adults);
  const [children, setChildren] = useState(reservation.children);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      switch (action) {
        case "modify-dates":
          await apiClient.requestPortalDateChange(token, reservation.id, {
            newArrival,
            newDeparture,
          });
          break;
        case "change-site":
          await apiClient.requestPortalSiteChange(token, reservation.id, { reason });
          break;
        case "add-guest":
          await apiClient.updatePortalGuestCount(token, reservation.id, { adults, children });
          break;
        case "cancel":
          await apiClient.requestPortalCancellation(token, reservation.id, { reason });
          break;
        case "pay-balance":
          window.open(`/portal/pay/${reservation.id}`, "_blank");
          onClose();
          return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case "modify-dates": return "Modify Dates";
      case "change-site": return "Request Site Change";
      case "add-guest": return "Update Guest Count";
      case "cancel": return "Cancel Reservation";
      case "pay-balance": return "Pay Balance";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{getTitle()}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          {action === "modify-dates" && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-1">New Check-in Date</label>
                <input
                  type="date"
                  value={newArrival}
                  onChange={(e) => setNewArrival(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">New Check-out Date</label>
                <input
                  type="date"
                  value={newDeparture}
                  onChange={(e) => setNewDeparture(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                />
              </div>
              <p className="text-sm text-slate-400">
                Date changes are subject to availability and may result in price adjustments.
              </p>
            </>
          )}

          {action === "change-site" && (
            <>
              <p className="text-sm text-slate-400">
                Submitting a request does not guarantee availability. We'll contact you to confirm options.
              </p>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason / Preferences</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                  placeholder="e.g., Need hookups, prefer shaded site..."
                />
              </div>
            </>
          )}

          {action === "add-guest" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Adults</label>
                  <input
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Children</label>
                  <input
                    type="number"
                    min={0}
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Additional guests may incur extra fees depending on campground policies.
              </p>
            </>
          )}

          {action === "cancel" && (
            <>
              <div className="bg-red-900/30 border border-red-800/30 rounded-lg p-4">
                <p className="text-sm text-red-300">
                  Cancellation fees may apply based on your booking date and campground policy. 
                  This action cannot be undone.
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2"
                  placeholder="Tell us why you're canceling..."
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800/30 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                action === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } disabled:opacity-50`}
            >
              {loading ? "Processing..." : action === "cancel" ? "Confirm Cancellation" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

