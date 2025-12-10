// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { AuditController } from "../audit/audit.controller";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionGuard } from "../permissions/permission.guard";

describe("Audit quick view", () => {
  let app: any;
  const campgroundId = "camp-quick-audit";

  const prismaStub = {
    auditLog: {
      findMany: jest.fn()
    },
    piiFieldTag: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    privacySetting: {
      findUnique: jest.fn()
    },
    auditExport: {
      create: jest.fn()
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prismaStub
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: "tester" };
      next();
    });
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaStub.privacySetting.findUnique.mockResolvedValue({
      campgroundId,
      redactPII: true,
      consentRequired: true,
      backupRetentionDays: 30,
      keyRotationDays: 90
    });
    prismaStub.piiFieldTag.count.mockResolvedValue(3);
    prismaStub.piiFieldTag.findMany.mockResolvedValue([
      { resource: "guest", field: "email", classification: "sensitive" },
      { resource: "guest", field: "phone", classification: "sensitive" }
    ]);
    prismaStub.auditLog.findMany.mockResolvedValue([
      {
        id: "a1",
        campgroundId,
        action: "update",
        entity: "privacySetting",
        entityId: "ps1",
        createdAt: new Date().toISOString(),
        ip: "127.0.0.1",
        userAgent: "jest",
        chainHash: "hash-1",
        prevHash: null,
        before: { email: "guest@example.com" },
        after: { email: "guest@example.com" },
        actor: { id: "user-1", email: "owner@test.com" }
      }
    ]);
    prismaStub.auditExport.create.mockResolvedValue({});
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns quick-audit snapshot with privacy defaults and audit events", async () => {
    const api = request(app.getHttpServer());
    const res = await api.get(`/api/campgrounds/${campgroundId}/audit/quick`).expect(200);

    expect(res.body.privacyDefaults).toMatchObject({
      redactPII: true,
      consentRequired: true,
      backupRetentionDays: 30,
      keyRotationDays: 90
    });
    expect(res.body.piiTagCount).toBe(3);
    expect(Array.isArray(res.body.piiTagsPreview)).toBe(true);
    expect(Array.isArray(res.body.auditEvents)).toBe(true);
    expect(res.body.auditEvents[0]).toMatchObject({
      action: "update",
      entity: "privacySetting"
    });
  });

  it("exports audit events as csv", async () => {
    const api = request(app.getHttpServer());
    const res = await api.get(`/api/campgrounds/${campgroundId}/audit?format=csv&limit=5`).expect(200);

    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text.split("\n")[0]).toContain("action");
    expect(res.text).toContain("update");
  });
});


