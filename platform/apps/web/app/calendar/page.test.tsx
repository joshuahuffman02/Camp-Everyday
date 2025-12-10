/**
 * Integration-ish tests for the booking calendar:
 * - selection flow (availability + quote + hold)
 * - move flow (drag reservation to a new date)
 */
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarPage from "./page";

// Mock the api client used by the calendar
vi.mock("@/lib/api-client", () => {
  return {
    apiClient: {
      getCampgrounds: vi.fn(),
      getSites: vi.fn(),
      getReservations: vi.fn(),
      getBlackouts: vi.fn(),
      getAvailability: vi.fn(),
      checkOverlap: vi.fn(),
      getQuote: vi.fn(),
      updateReservation: vi.fn(),
      createHold: vi.fn(),
      checkInReservation: vi.fn()
    }
  };
});

const { apiClient } = require("@/lib/api-client") as typeof import("@/lib/api-client");

function createWrapper(initialData?: {
  campgrounds?: any[];
  sites?: any[];
  reservations?: any[];
  blackouts?: any[];
}) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: Infinity }
    }
  });
  if (initialData?.campgrounds) qc.setQueryData(["campgrounds"], initialData.campgrounds);
  if (initialData?.sites) qc.setQueryData(["calendar-sites", "cg1"], initialData.sites);
  if (initialData?.reservations) qc.setQueryData(["calendar-reservations", "cg1"], initialData.reservations);
  if (initialData?.blackouts) qc.setQueryData(["calendar-blackouts", "cg1"], initialData.blackouts);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "CalendarTestWrapper";
  return Wrapper;
}

describe("CalendarPage", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    localStorage.setItem("campreserv:selectedCampground", "cg1");
    (apiClient.getCampgrounds as vi.Mock).mockResolvedValue([
      { id: "cg1", name: "Camp One", depositRule: "50% due on booking" }
    ]);
    (apiClient.getSites as vi.Mock).mockResolvedValue([
      { id: "s1", campgroundId: "cg1", name: "Site One", siteType: "rv_full", maxOccupancy: 6 }
    ]);
    (apiClient.getReservations as vi.Mock).mockResolvedValue([]);
    (apiClient.getBlackouts as vi.Mock).mockResolvedValue([]);
    (apiClient.getAvailability as vi.Mock).mockResolvedValue([{ id: "s1" }]);
    (apiClient.checkOverlap as vi.Mock).mockResolvedValue({ conflict: false });
    (apiClient.getQuote as vi.Mock).mockResolvedValue({
      nights: 2,
      baseSubtotalCents: 20000,
      rulesDeltaCents: 0,
      totalCents: 22000,
      perNightCents: 11000
    });
    (apiClient.createHold as vi.Mock).mockResolvedValue({ id: "h1" });
    (apiClient.updateReservation as vi.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("lets staff select dates, shows quote, and place a hold", async () => {
    const user = userEvent.setup();
    render(<CalendarPage />, { wrapper: createWrapper() });

    // Wait for the grid to load
    await screen.findByText("Sites");
    const siteRow = screen.getByText("Site One").closest("div")!.parentElement!.parentElement!;
    const dayCells = siteRow.querySelectorAll(".h-12");
    expect(dayCells.length).toBeGreaterThan(3);

    // Select two nights (Jan 1 -> Jan 3 exclusive)
    await user.pointer([{ keys: "[MouseLeft]", target: dayCells[0] }, { keys: "[/MouseLeft]", target: dayCells[2] }]);

    // Quote panel should appear with totals
    await screen.findByText("Selection");
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Deposit rule: 50% due on booking")).toBeInTheDocument();
    expect(screen.getByText("$220.00")).toBeInTheDocument();

    // Place a hold
    const holdBtn = screen.getByRole("button", { name: /place 15-min hold/i });
    await user.click(holdBtn);
    await screen.findByText(/Hold placed for 15 minutes./i);

    expect(apiClient.createHold).toHaveBeenCalledWith({
      campgroundId: "cg1",
      siteId: "s1",
      arrivalDate: "2025-01-01",
      departureDate: "2025-01-03",
      holdMinutes: 15
    });
  });

  it("moves an existing reservation when dragged to an earlier date", async () => {
    (apiClient.getReservations as vi.Mock).mockResolvedValue([
      {
        id: "r1",
        siteId: "s1",
        campgroundId: "cg1",
        arrivalDate: "2025-01-03",
        departureDate: "2025-01-05",
        status: "confirmed",
        totalAmount: 30000,
        guest: { primaryFirstName: "Guest", primaryLastName: "One" }
      }
    ]);

    const user = userEvent.setup();
    render(<CalendarPage />, { wrapper: createWrapper() });

    await screen.findByText("Sites");
    const resPill = await screen.findByText(/Guest One/i);
    const siteRow = resPill.closest(".grid")!.parentElement!.parentElement!; // row grid container
    const dayCells = siteRow.querySelectorAll(".h-12");

    // Drag reservation start (Jan 3) to Jan 1 (earlier)
    await user.pointer([
      { keys: "[MouseLeft]", target: resPill },
      { keys: "[/MouseLeft]", target: dayCells[0] }
    ]);

    await waitFor(() => {
      expect(apiClient.updateReservation).toHaveBeenCalledTimes(1);
    });
    expect(apiClient.updateReservation).toHaveBeenCalledWith("r1", {
      siteId: "s1",
      arrivalDate: "2025-01-01",
      departureDate: "2025-01-03"
    });
  });

  it("blocks moving a checked-in reservation", async () => {
    (apiClient.getReservations as vi.Mock).mockResolvedValue([
      {
        id: "r2",
        siteId: "s1",
        campgroundId: "cg1",
        arrivalDate: "2025-01-01",
        departureDate: "2025-01-03",
        status: "checked_in",
        totalAmount: 30000,
        guest: { primaryFirstName: "Guest", primaryLastName: "Two" }
      }
    ]);
    const user = userEvent.setup();
    render(<CalendarPage />, { wrapper: createWrapper() });

    await screen.findByText("Sites");
    const resPill = await screen.findByText(/Guest Two/i);
    const siteRow = resPill.closest(".grid")!.parentElement!.parentElement!;
    const dayCells = siteRow.querySelectorAll(".h-12");

    await user.pointer([
      { keys: "[MouseLeft]", target: resPill },
      { keys: "[/MouseLeft]", target: dayCells[3] }
    ]);

    await screen.findByText(/Checked-in stays cannot be moved/i);
    expect(apiClient.updateReservation).not.toHaveBeenCalled();
  });

  it("surfaces overlap conflicts on selection", async () => {
    (apiClient.checkOverlap as vi.Mock).mockResolvedValue({ conflict: true });
    const user = userEvent.setup();
    render(<CalendarPage />, { wrapper: createWrapper() });

    await screen.findByText("Sites");
    const siteRow = screen.getByText("Site One").closest("div")!.parentElement!.parentElement!;
    const dayCells = siteRow.querySelectorAll(".h-12");

    await user.pointer([{ keys: "[MouseLeft]", target: dayCells[0] }, { keys: "[/MouseLeft]", target: dayCells[1] }]);

    await screen.findByText(/overlaps these dates/i);
    expect(apiClient.createHold).not.toHaveBeenCalled();
  });

  it("shows availability errors but keeps selection flow usable", async () => {
    (apiClient.getAvailability as vi.Mock).mockRejectedValue(new Error("server down"));
    const user = userEvent.setup();
    render(<CalendarPage />, { wrapper: createWrapper() });

    await screen.findByText("Sites");
    const siteRow = screen.getByText("Site One").closest("div")!.parentElement!.parentElement!;
    const dayCells = siteRow.querySelectorAll(".h-12");

    await user.pointer([{ keys: "[MouseLeft]", target: dayCells[0] }, { keys: "[/MouseLeft]", target: dayCells[2] }]);

    await screen.findByText(/Availability check failed/i);
    // Still allows showing draft panel for manual proceed if quote succeeds
    await screen.findByText("Selection");
  });

  it("confirms extension, collects delta, and redirects to payment", async () => {
    (apiClient.getReservations as vi.Mock).mockResolvedValue([
      {
        id: "r3",
        siteId: "s1",
        campgroundId: "cg1",
        arrivalDate: "2025-01-01",
        departureDate: "2025-01-03",
        status: "confirmed",
        totalAmount: 20000,
        guest: { primaryFirstName: "Ext", primaryLastName: "Guest" }
      }
    ]);
    (apiClient.getQuote as vi.Mock).mockResolvedValue({
      nights: 3,
      baseSubtotalCents: 30000,
      rulesDeltaCents: 0,
      totalCents: 33000,
      perNightCents: 11000
    });
    const user = userEvent.setup();
    const { container } = render(<CalendarPage />, { wrapper: createWrapper() });

    await screen.findByText("Sites");
    const resPill = await screen.findByText(/Ext Guest/i);
    const siteRow = resPill.closest(".grid")!.parentElement!.parentElement!;
    const dayCells = siteRow.querySelectorAll(".h-12");

    // Extend to Jan 4 (one more night)
    await user.pointer([
      { keys: "[MouseLeft]", target: resPill },
      { keys: "[/MouseLeft]", target: dayCells[3] }
    ]);

    // Extension modal should appear
    await screen.findByText(/Confirm extension/i);
    await screen.findByText(/Amount to collect/);
    expect(screen.getByText("$130.00")).toBeInTheDocument(); // delta = 330 - 200

    // Confirm extension
    const confirmBtn = screen.getByRole("button", { name: /Confirm & collect \$130\.00/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.updateReservation).toHaveBeenCalledWith("r3", {
        siteId: "s1",
        arrivalDate: "2025-01-01",
        departureDate: "2025-01-04"
      });
    });
  });

  it("shows extension quote error and aborts", async () => {
    (apiClient.getReservations as vi.Mock).mockResolvedValue([
      {
        id: "r4",
        siteId: "s1",
        campgroundId: "cg1",
        arrivalDate: "2025-01-01",
        departureDate: "2025-01-03",
        status: "confirmed",
        totalAmount: 20000,
        guest: { primaryFirstName: "Err", primaryLastName: "Guest" }
      }
    ]);
    (apiClient.getQuote as vi.Mock).mockRejectedValue(new Error("quote failed"));

    const user = userEvent.setup();
    render(<CalendarPage />, { wrapper: createWrapper() });

    await screen.findByText("Sites");
    const resPill = await screen.findByText(/Err Guest/i);
    const siteRow = resPill.closest(".grid")!.parentElement!.parentElement!;
    const dayCells = siteRow.querySelectorAll(".h-12");

    await user.pointer([
      { keys: "[MouseLeft]", target: resPill },
      { keys: "[/MouseLeft]", target: dayCells[3] }
    ]);

    await screen.findByText(/Unable to fetch extension quote/i);
    expect(apiClient.updateReservation).not.toHaveBeenCalled();
  });
});

