import { CanActivate, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PrivacyController } from "../src/privacy/privacy.controller";
import { PrivacyService } from "../src/privacy/privacy.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtAuthGuard } from "../src/auth/guards";
import { RolesGuard } from "../src/auth/guards/roles.guard";

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe("Privacy export API smoke", () => {
  let app: INestApplication;
  const prisma = {
    privacySetting: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    consentLog: {
      findMany: jest.fn(),
    },
    piiFieldTag: {
      findMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    prisma.privacySetting.findUnique.mockResolvedValue({
      campgroundId: "cg1",
      redactPII: true,
      consentRequired: false,
      backupRetentionDays: 45,
      keyRotationDays: 60,
    });
    prisma.privacySetting.create.mockResolvedValue({
      campgroundId: "cg1",
      redactPII: true,
      consentRequired: false,
      backupRetentionDays: 45,
      keyRotationDays: 60,
    });
    prisma.consentLog.findMany.mockResolvedValue([
      {
        id: "consent-1",
        campgroundId: "cg1",
        subject: "guest@example.com",
        consentType: "marketing",
        grantedBy: "admin@example.com",
        grantedAt: new Date("2024-01-01T00:00:00.000Z"),
        purpose: "promotions",
        method: "digital",
        expiresAt: null,
        revokedAt: null,
      },
    ]);
    prisma.piiFieldTag.findMany.mockResolvedValue([
      { resource: "guest", field: "email", classification: "sensitive", redactionMode: "mask" },
    ]);

    const moduleRef = await Test.createTestingModule({
      controllers: [PrivacyController],
      providers: [
        PrivacyService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtAuthGuard, useClass: AllowGuard },
        { provide: RolesGuard, useClass: AllowGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new AllowGuard())
      .overrideGuard(RolesGuard)
      .useValue(new AllowGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns JSON bundle with settings, consents, and tags", async () => {
    const res = await request(app.getHttpServer()).get("/campgrounds/cg1/privacy/export");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        campgroundId: "cg1",
        settings: expect.objectContaining({
          redactPII: expect.any(Boolean),
          consentRequired: expect.any(Boolean),
          backupRetentionDays: expect.any(Number),
          keyRotationDays: expect.any(Number),
        }),
        consents: expect.any(Array),
        piiTags: expect.any(Array),
      }),
    );
    expect(res.body.consents.length).toBeGreaterThan(0);
    expect(res.body.piiTags[0]).toEqual(
      expect.objectContaining({
        resource: expect.any(String),
        field: expect.any(String),
      }),
    );
  });

  it("returns CSV export with download headers", async () => {
    const res = await request(app.getHttpServer()).get("/campgrounds/cg1/privacy/export?format=csv");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("privacy-consent-export.csv");
    const lines = res.text.split("\n").filter(Boolean);
    expect(lines[0]).toContain("type,campgroundId");
    expect(lines.some((line) => line.startsWith("consent"))).toBe(true);
    expect(lines.some((line) => line.startsWith("pii_tag"))).toBe(true);
  });
});


