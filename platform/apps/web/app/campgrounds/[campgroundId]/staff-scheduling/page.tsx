"use client";

import { useEffect, useState } from "react";

type Shift = {
  id: string;
  userId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  role?: string | null;
};

export default function StaffSchedulingPage({ params }: { params: { campgroundId: string } }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    date: "",
    start: "09:00",
    end: "17:00",
    role: "front_desk",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/staff/shifts?campgroundId=${params.campgroundId}&startDate=${new Date().toISOString()}&endDate=${new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );
      const data = await res.json();
      setShifts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createShift = async () => {
    await fetch(`/api/staff/shifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campgroundId: params.campgroundId,
        userId: form.userId,
        shiftDate: form.date,
        startTime: form.start,
        endTime: form.end,
        role: form.role,
      }),
    });
    await load();
  };

  return (
    <div className="space-y-6 p-6">
      <div data-testid="staff-header">
        <h1 className="text-2xl font-semibold">Staff Scheduling</h1>
        <p className="text-slate-500">Plan shifts and roles for the team.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-2" data-testid="staff-create-card">
          <h2 className="text-lg font-medium">Create Shift</h2>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="User ID"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          />
          <input
            className="w-full rounded border px-3 py-2"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className="w-full rounded border px-3 py-2"
              type="time"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
            <input
              className="w-full rounded border px-3 py-2"
              type="time"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </div>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <button
            className="mt-2 rounded bg-teal-600 px-4 py-2 text-white"
            onClick={createShift}
            data-testid="assign-staff-button"
          >
            Save Shift
          </button>
        </div>

        <div className="rounded-lg border p-4" data-testid="calendar-view">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Upcoming Shifts</h2>
            {loading && <span className="text-sm text-slate-500" data-testid="staff-loading">Loading…</span>}
          </div>
          <div className="space-y-2">
            {shifts.map((shift) => (
              <div key={shift.id} className="rounded border px-3 py-2" data-testid="shift-tile">
                <div className="font-semibold">{shift.role || "Shift"}</div>
                <div className="text-xs text-slate-500">
                  {shift.shiftDate?.slice(0, 10)} · {new Date(shift.startTime).toLocaleTimeString()} -{" "}
                  {new Date(shift.endTime).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {!shifts.length && <div className="text-sm text-slate-500" data-testid="staff-empty">No shifts scheduled.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

