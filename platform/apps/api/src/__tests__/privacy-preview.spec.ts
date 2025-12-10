import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe, CanActivate } from "@nestjs/common";
import { PrivacyModule } from "../privacy/privacy.module";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("Privacy redaction preview", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const campgroundId = "camp-privacy-preview";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrivacyModule],
      providers: [PrismaService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalGuards(new (class implements CanActivate { canActivate() { return true; } })());
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.piiFieldTag.upsert({
      where: { resource_field: { resource: "guest", field: "ssn" } } as any,
      update: { classification: "secret" as any, redactionMode: "remove" as any },
      create: { resource: "guest", field: "ssn", classification: "secret" as any, redactionMode: "remove" as any },
    });
  });

  afterAll(async () => {
    await prisma.piiFieldTag.deleteMany({ where: { resource: "guest", field: "ssn" } });
    await app.close();
  });

  it("masks email/phone and drops removed fields via preview endpoint", async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .post(`/api/campgrounds/${campgroundId}/privacy/preview`)
      .send({
        resource: "guest",
        sample: {
          email: "person@example.com",
          phone: "555-000-1111",
          ssn: "123-45-6789",
          notes: "Call back at 555-222-3333",
        },
      })
      .expect(201);

    expect(res.body.redacted.email).toBe("***@redacted");
    expect(res.body.redacted.phone).toBe("***-***-****");
    expect(res.body.redacted.ssn).toBeUndefined();
    expect(res.body.redacted.notes).toContain("***-***-****");
    expect(Array.isArray(res.body.rulesApplied)).toBe(true);
  });
});


