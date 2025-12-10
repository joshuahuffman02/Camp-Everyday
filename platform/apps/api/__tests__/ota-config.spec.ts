import { describe, it, expect, jest } from "@jest/globals";
import { OtaController } from "../src/ota/ota.controller";
import { OtaService } from "../src/ota/ota.service";

describe("OTA config stub endpoint", () => {
  it("stores and returns OTA config without external calls", async () => {
    const prisma: any = {};
    const service = new OtaService(prisma);
    const controller = new OtaController(service as any);

    (global as any).fetch = jest.fn();

    const saved = await controller.saveConfig("cg-test", {
      provider: "Hipcamp",
      externalAccountId: "acct_123",
      propertyId: "prop_456",
      apiKey: "key_abc",
      channelId: "chan_789",
      notes: "Stub credentials for smoke test",
    });

    expect(saved.lastSyncStatus).toBe("stubbed");
    expect(saved.pendingSyncs).toBe(0);
    expect(saved.externalAccountId).toBe("acct_123");
    expect(saved.propertyId).toBe("prop_456");
    expect(saved.lastUpdatedAt).toBeTruthy();

    const fetched = await controller.getConfig("cg-test");
    expect(fetched.externalAccountId).toBe("acct_123");
    expect(fetched.lastSyncMessage).toMatch(/Saved locally/i);

    const syncStatus = await controller.getSyncStatus("cg-test");
    expect(syncStatus.lastSyncStatus).toBe("stubbed");
    expect(syncStatus.pendingSyncs).toBe(0);

    expect((global as any).fetch).not.toHaveBeenCalled();
  });
});

