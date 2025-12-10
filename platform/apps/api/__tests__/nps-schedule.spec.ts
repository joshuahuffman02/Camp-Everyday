// @ts-nocheck
import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { NpsService } from "../src/nps/nps.service";

describe("NPS schedule enqueue", () => {
  const emailService = { sendEmail: jest.fn() };
  const supportService = { create: jest.fn() };
  let prisma: any;
  let service: NpsService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T07:30:00Z"));
    prisma = {
      campground: { findMany: jest.fn() },
      npsSurvey: { findMany: jest.fn() },
      communicationPlaybook: { findFirst: jest.fn(), create: jest.fn() },
      reservation: { findMany: jest.fn() },
      communicationPlaybookJob: { findFirst: jest.fn(), create: jest.fn() }
    };
    service = new NpsService(prisma as any, emailService as any, supportService as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("creates jobs for arrival-before and departure-after entries at the correct offsets", async () => {
    prisma.campground.findMany.mockResolvedValue([
      {
        id: "cg1",
        timezone: "UTC",
        npsAutoSendEnabled: true,
        npsSendHour: 7,
        npsTemplateId: "tpl-default",
        npsSchedule: [
          { id: "arr-before-0d", anchor: "arrival", direction: "before", offset: 0, unit: "days", enabled: true },
          { id: "dep-after-0d", anchor: "departure", direction: "after", offset: 0, unit: "days", enabled: true }
        ]
      }
    ]);
    prisma.npsSurvey.findMany.mockResolvedValue([
      { id: "survey1", campgroundId: "cg1", rules: [{}] }
    ]);
    prisma.communicationPlaybook.findFirst.mockResolvedValue({ id: "pb-nps", templateId: "tpl-default" });
    prisma.reservation.findMany.mockResolvedValue([
      {
        id: "res-arrival",
        campgroundId: "cg1",
        guestId: "guest-arrival",
        arrivalDate: new Date("2025-01-01T12:00:00Z"),
        departureDate: new Date("2025-01-02T12:00:00Z"),
        status: "confirmed",
        guest: { email: "arrival@example.com" }
      },
      {
        id: "res-departure",
        campgroundId: "cg1",
        guestId: "guest-departure",
        arrivalDate: new Date("2024-12-31T12:00:00Z"),
        departureDate: new Date("2025-01-01T12:00:00Z"),
        status: "confirmed",
        guest: { email: "departure@example.com" }
      }
    ]);
    prisma.communicationPlaybookJob.findFirst.mockResolvedValue(null);

    await service.sendPostCheckoutInvites();

    expect(prisma.communicationPlaybookJob.create).toHaveBeenCalledTimes(2);
    const calls = prisma.communicationPlaybookJob.create.mock.calls.map((c: any) => c[0].data);

    const arrivalJob = calls.find((c: any) => c.reservationId === "res-arrival");
    const departureJob = calls.find((c: any) => c.reservationId === "res-departure");

    expect(arrivalJob?.metadata.entryId).toBe("arr-before-0d");
    expect(departureJob?.metadata.entryId).toBe("dep-after-0d");

    expect(new Date(arrivalJob!.scheduledAt).toISOString()).toContain("2025-01-01T07:00:00");
    expect(new Date(departureJob!.scheduledAt).toISOString()).toContain("2025-01-01T07:00:00");
  });
});

