// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { AbandonedCartModule } from "../abandoned-cart/abandoned-cart.module";
import { JwtAuthGuard } from "../auth/guards";

describe("Abandoned cart smoke", () => {
  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AbandonedCartModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: "abandon-user", role: "owner" };
      req.campgroundId = "camp-abandon-test";
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("queues, lists, and marks abandoned carts (stub)", async () => {
    const api = request(app.getHttpServer());
    const queued = await api
      .post("/api/abandoned-carts/queue")
      .send({
        campgroundId: "camp-abandon-test",
        email: "guest@example.com",
        abandonedAt: new Date().toISOString(),
      })
      .expect(201);

    expect(queued.body?.channel).toBe("email");

    const list = await api.get("/api/abandoned-carts?campgroundId=camp-abandon-test").expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);

    const contact = await api
      .post(`/api/abandoned-carts/${queued.body.id}/contact`)
      .send({ note: "Recovery ping" })
      .expect(201);

    expect(contact.body?.status).toBe("contacted");
  });
});

