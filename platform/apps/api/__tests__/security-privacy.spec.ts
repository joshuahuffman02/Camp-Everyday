import { CanActivate, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AuditController } from "../src/audit/audit.controller";
import { AuditService } from "../src/audit/audit.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtAuthGuard } from "../src/auth/guards";
import { RolesGuard } from "../src/auth/guards/roles.guard";
import { PermissionGuard } from "../src/permissions/permission.guard";

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe("Security/Privacy audit API smoke", () => {
  let app: INestApplication;
  const prisma = {
    auditLog: {
      findMany: jest.fn()
    },
    privacySetting: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    auditExport: {
      create: jest.fn()
    },
    piiFieldTag: {
      count: jest.fn(),
      findMany: jest.fn()
    }
  };

  const sampleRows = [
    {
      id: "a1",
      campgroundId: "cg1",
      actorId: "u1",
      action: "updated",
      entity: "privacy",
      entityId: "cg1",
      createdAt: new Date().toISOString(),
      actor: { id: "u1", email: "user@example.com", firstName: "Test", lastName: "User" }
    },
    {
      id: "a2",
      campgroundId: "cg1",
      actorId: null,
      action: "viewed",
      entity: "audit",
      entityId: "cg1",
      createdAt: new Date().toISOString(),
      actor: null
    }
  ];

  beforeAll(async () => {
    prisma.auditLog.findMany.mockResolvedValue(sampleRows);
    prisma.privacySetting.findUnique.mockResolvedValue({
      campgroundId: "cg1",
      redactPII: false,
      consentRequired: true,
      backupRetentionDays: 30,
      keyRotationDays: 90
    });
    prisma.auditExport.create.mockResolvedValue({});
    prisma.piiFieldTag.count.mockResolvedValue(3);
    prisma.piiFieldTag.findMany.mockResolvedValue([
      { resource: "guests", field: "email", classification: "pii", redactionMode: null },
      { resource: "guests", field: "phone", classification: "pii", redactionMode: "mask" }
    ]);

    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtAuthGuard, useClass: AllowGuard },
        { provide: RolesGuard, useClass: AllowGuard },
        { provide: PermissionGuard, useClass: AllowGuard }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new AllowGuard())
      .overrideGuard(RolesGuard)
      .useValue(new AllowGuard())
      .overrideGuard(PermissionGuard)
      .useValue(new AllowGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 and basic shape for audit list", async () => {
    const res = await request(app.getHttpServer()).get("/campgrounds/cg1/audit?limit=5");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        action: expect.any(String),
        entity: expect.any(String)
      })
    );
  });

  it("returns csv export with audit rows and download headers", async () => {
    const res = await request(app.getHttpServer()).get("/campgrounds/cg1/audit?format=csv");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment; filename=audit.csv");

    const lines = res.text.split("\n").filter(Boolean);
    expect(lines[0]).toContain("id,campgroundId,actorId,action,entity,entityId,createdAt,ip,userAgent,chainHash,prevHash,before,after");
    expect(lines[1]).toContain("a1");
  });

  it("returns json export with correct headers and shape", async () => {
    const res = await request(app.getHttpServer()).get("/campgrounds/cg1/audit?format=json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        action: expect.any(String),
        createdAt: expect.anything()
      })
    );
  });

  it("returns quick audit summary", async () => {
    const res = await request(app.getHttpServer()).get("/campgrounds/cg1/audit/quick");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        privacyDefaults: expect.objectContaining({
          redactPII: expect.any(Boolean),
          consentRequired: expect.any(Boolean)
        }),
        piiTagCount: expect.any(Number),
        auditEvents: expect.any(Array)
      })
    );
    expect(res.body.auditEvents.length).toBeGreaterThan(0);
  });
});

