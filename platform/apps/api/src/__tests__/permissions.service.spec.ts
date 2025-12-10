import { PermissionEffect, UserRole } from "@prisma/client";
import { PermissionsService } from "../permissions/permissions.service";

describe("PermissionsService", () => {
  const prismaMock: any = {
    permissionRule: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn()
    },
    approvalRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    }
  };

  const service = new PermissionsService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("denies when no rules match", async () => {
    prismaMock.permissionRule.findMany.mockResolvedValue([]);
    const res = await service.checkAccess({
      user: { memberships: [{ campgroundId: "camp1", role: UserRole.front_desk }] },
      campgroundId: "camp1",
      region: "r1",
      resource: "communications",
      action: "read"
    });
    expect(res.allowed).toBe(false);
  });

  it("allows when an allow rule matches region and field", async () => {
    prismaMock.permissionRule.findMany.mockResolvedValue([
      {
        role: UserRole.front_desk,
        resource: "communications",
        action: "read",
        fields: ["__region:r1", "body"],
        effect: PermissionEffect.allow
      }
    ]);

    const res = await service.checkAccess({
      user: { memberships: [{ campgroundId: "camp1", role: UserRole.front_desk }], region: "r1" },
      campgroundId: "camp1",
      region: "r1",
      resource: "communications",
      action: "read",
      field: "body"
    });
    expect(res.allowed).toBe(true);
  });

  it("denies when a deny rule matches", async () => {
    prismaMock.permissionRule.findMany.mockResolvedValue([
      {
        role: UserRole.front_desk,
        resource: "communications",
        action: "read",
        fields: [],
        effect: PermissionEffect.deny
      }
    ]);

    const res = await service.checkAccess({
      user: { memberships: [{ campgroundId: "camp1", role: UserRole.front_desk }] },
      campgroundId: "camp1",
      region: "r1",
      resource: "communications",
      action: "read"
    });
    expect(res.allowed).toBe(false);
  });

  it("persists regions inside fields on upsert", async () => {
    prismaMock.permissionRule.upsert.mockResolvedValue({});
    await service.upsertRule({
      campgroundId: "camp1",
      role: UserRole.front_desk,
      resource: "communications",
      action: "read",
      fields: ["body"],
      regions: ["r1"],
      effect: PermissionEffect.allow
    });
    expect(prismaMock.permissionRule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          fields: expect.arrayContaining(["body", "__region:r1"])
        })
      })
    );
  });

  it("treats owners/managers as superusers", async () => {
    const resOwner = await service.checkAccess({
      user: { role: UserRole.owner, memberships: [] },
      campgroundId: "campX",
      region: "r1",
      resource: "finance",
      action: "write"
    });
    expect(resOwner.allowed).toBe(true);

    const resManager = await service.checkAccess({
      user: { role: UserRole.manager, memberships: [] },
      campgroundId: "campX",
      region: "r1",
      resource: "finance",
      action: "write"
    });
    expect(resManager.allowed).toBe(true);
  });

  it("prefers campground-specific rule over global", async () => {
    prismaMock.permissionRule.findMany.mockResolvedValue([
      {
        role: UserRole.front_desk,
        resource: "communications",
        action: "read",
        fields: [],
        effect: PermissionEffect.allow,
        campgroundId: "camp1"
      },
      {
        role: UserRole.front_desk,
        resource: "communications",
        action: "read",
        fields: [],
        effect: PermissionEffect.deny,
        campgroundId: null
      }
    ]);

    const res = await service.checkAccess({
      user: { memberships: [{ campgroundId: "camp1", role: UserRole.front_desk }] },
      campgroundId: "camp1",
      region: null,
      resource: "communications",
      action: "read"
    });
    expect(res.allowed).toBe(true);
  });

  it("denies when region-tagged rule does not match", async () => {
    prismaMock.permissionRule.findMany.mockResolvedValue([
      {
        role: UserRole.front_desk,
        resource: "communications",
        action: "read",
        fields: ["__region:r2"],
        effect: PermissionEffect.allow
      }
    ]);

    const res = await service.checkAccess({
      user: { memberships: [{ campgroundId: "camp1", role: UserRole.front_desk }], region: "r1" },
      campgroundId: "camp1",
      region: "r1",
      resource: "communications",
      action: "read"
    });
    expect(res.allowed).toBe(false);
  });
});

