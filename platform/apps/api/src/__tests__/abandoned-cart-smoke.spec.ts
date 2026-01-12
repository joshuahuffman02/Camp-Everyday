import { Test, type TestingModule } from "@nestjs/testing";
import { AbandonedCartService } from "../abandoned-cart/abandoned-cart.service";

describe("Abandoned cart smoke", () => {
  let moduleRef: TestingModule;
  let service: AbandonedCartService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [AbandonedCartService],
    }).compile();
    service = moduleRef.get(AbandonedCartService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("queues, lists, and marks abandoned carts (stub)", async () => {
    const queued = service.record({
      campgroundId: "camp-abandon-test",
      email: "guest@example.com",
      abandonedAt: new Date().toISOString(),
    });

    expect(queued?.channel).toBe("email");

    const list = service.list("camp-abandon-test");
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    const contact = service.markContacted(queued.id, "Recovery ping");
    expect(contact?.status).toBe("contacted");
  });
});
