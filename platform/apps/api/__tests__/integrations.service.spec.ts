import { IntegrationsService } from "../src/integrations/integrations.service";

describe("IntegrationsService sandbox QBO", () => {
  const prisma: any = {
    integrationConnection: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    integrationSyncLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        QueryResponse: {
          Account: [
            { Id: "1", Name: "Cash", AccountType: "Asset" },
            { Id: "2", Name: "Payable", AccountType: "Liability" },
          ]
        }
      })
    });
    process.env.QBO_SANDBOX_TOKEN = "token";
    process.env.QBO_SANDBOX_REALMID = "realm";
  });

  it("runs sandbox pull and logs success", async () => {
    const svc = new IntegrationsService(prisma as any);
    prisma.integrationConnection.findUnique.mockResolvedValue({
      id: "conn1",
      provider: "qbo",
      type: "accounting",
      settings: { realmId: "realm" }
    });
    prisma.integrationConnection.update.mockResolvedValue({});
    prisma.integrationSyncLog.create.mockResolvedValue({});

    const result = await svc.triggerSync("conn1", { note: "test" });

    expect(result?.sandbox).toBe(true);
    expect(prisma.integrationSyncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "queued"
        })
      })
    );
    expect(prisma.integrationConnection.update).toHaveBeenCalled();
  });
});

