import { CheckInStatus } from "@prisma/client";
import { SelfCheckinService } from "../self-checkin/self-checkin.service";

describe("SelfCheckinService compliance enforcement", () => {
  let prisma: any;
  let signatures: any;
  let audit: any;
  let access: any;
  let stripe: any;
  let gatewayConfig: any;
  let policies: any;
  let service: SelfCheckinService;

  const baseReservation = {
    id: "res1",
    campgroundId: "cg1",
    siteId: "site1",
    guestId: "guest1",
    paymentRequired: true,
    paymentStatus: "paid",
    idVerificationRequired: false,
    waiverRequired: true,
    siteReady: true,
    status: "confirmed",
    guest: { id: "guest1", email: "guest@test.com" },
    campground: { id: "cg1", name: "Test Camp" },
    site: { siteNumber: "A1" }
  };

  beforeEach(() => {
    prisma = {
      reservation: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      maintenanceTicket: { findFirst: jest.fn() },
      communication: { create: jest.fn() },
      signatureRequest: { findFirst: jest.fn() },
      signatureArtifact: { findFirst: jest.fn() },
      digitalWaiver: { findFirst: jest.fn() },
      idVerification: { findFirst: jest.fn() }
    };
    signatures = { autoSendForReservation: jest.fn() };
    audit = { record: jest.fn() };
    access = { autoGrantForReservation: jest.fn(), revokeAllForReservation: jest.fn() };
    stripe = { createPaymentIntent: jest.fn(), isConfigured: jest.fn() };
    gatewayConfig = { getConfig: jest.fn() };
    policies = { getPendingPolicyCompliance: jest.fn().mockResolvedValue({ ok: true }) };
    service = new SelfCheckinService(prisma as any, signatures as any, audit as any, access as any, stripe as any, gatewayConfig as any, policies as any);
  });

  it("blocks check-in until waiver is signed and returns signing URL", async () => {
    prisma.reservation.findUnique.mockResolvedValue(baseReservation);
    prisma.maintenanceTicket.findFirst.mockResolvedValue(null);
    prisma.signatureRequest.findFirst.mockResolvedValue(null);
    prisma.signatureArtifact.findFirst.mockResolvedValue(null);
    prisma.digitalWaiver.findFirst.mockResolvedValue(null);
    prisma.reservation.update.mockResolvedValue({ ...baseReservation, checkInStatus: CheckInStatus.pending_waiver });
    signatures.autoSendForReservation.mockResolvedValue({ signingUrl: "https://app.campreserv.com/sign/token" });

    const result = await service.selfCheckin("res1");

    expect(result.status).toBe("failed");
    expect(result.reason).toBe("waiver_required");
    expect(result.signingUrl).toContain("/sign/");
    expect(prisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ checkInStatus: CheckInStatus.pending_waiver })
      })
    );
  });

  it("allows override but audits and auto-grants access", async () => {
    prisma.reservation.findUnique.mockResolvedValue(baseReservation);
    prisma.maintenanceTicket.findFirst.mockResolvedValue(null);
    prisma.signatureRequest.findFirst.mockResolvedValue(null);
    prisma.signatureArtifact.findFirst.mockResolvedValue(null);
    prisma.digitalWaiver.findFirst.mockResolvedValue(null);
    prisma.reservation.update.mockResolvedValue({
      ...baseReservation,
      status: "checked_in",
      checkInStatus: CheckInStatus.completed,
      selfCheckInAt: new Date()
    });

    // Use the correct guest ID to pass validation
    const result = await service.selfCheckin("res1", { override: true, overrideReason: "staff override", actorId: "guest1" });

    expect(result.status).toBe("completed");
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "checkin.override",
        actorId: "guest1",
        entityId: "res1"
      })
    );
    expect(access.autoGrantForReservation).toHaveBeenCalledWith("res1", "guest1");
  });
});
