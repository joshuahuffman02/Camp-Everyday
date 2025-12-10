"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";
import { Button } from "../../components/ui/button";
import { HelpAnchor } from "../../components/help/HelpAnchor";

export default function ReservationsLanding() {
  const router = useRouter();
  const [selectedCg, setSelectedCg] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("campreserv:selectedCampground");
    if (stored && /^c[a-z0-9]{10,}$/i.test(stored)) {
      setSelectedCg(stored);
      router.replace(`/campgrounds/${stored}/reservations`);
    } else {
      setSelectedCg(null);
    }
  }, [router]);

  return (
    <DashboardShell>
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Reservations</h1>
          <HelpAnchor topicId="reservation-manage" label="How to manage reservations" />
        </div>
        <p className="text-slate-600 text-sm">
          Reservations are scoped by campground. {selectedCg ? "Redirecting you to your campground…" : "Pick a campground to view or edit its bookings, or head to Booking to create a new one."}
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/campgrounds">Choose campground</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/booking">Create reservation</Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
