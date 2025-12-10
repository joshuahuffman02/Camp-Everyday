// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { ActivitiesModule } from "../activities/activities.module";
import { JwtAuthGuard } from "../auth/guards";
import { PrismaService } from "../prisma/prisma.service";

describe("Activities capacity smoke", () => {
  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ActivitiesModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("exposes capacity snapshot, updates cap, and accepts waitlist entries (stub)", async () => {
    const api = request(app.getHttpServer());

    const capacity = await api.get("/api/activities/demo-activity/capacity").expect(200);
    expect(capacity.body?.capacity).toBeGreaterThan(0);
    expect(capacity.body).toHaveProperty("remaining");

    const updated = await api
      .patch("/api/activities/demo-activity/capacity")
      .send({ capacity: 25, waitlistEnabled: true })
      .expect(200);
    expect(updated.body.capacity).toBe(25);
    expect(updated.body.waitlistEnabled).toBe(true);

    const waitlist = await api
      .post("/api/activities/demo-activity/waitlist")
      .send({ guestName: "Capacity Test", partySize: 3 })
      .expect(201);
    expect(waitlist.body?.snapshot?.waitlistCount).toBeGreaterThan(0);
  });
});


