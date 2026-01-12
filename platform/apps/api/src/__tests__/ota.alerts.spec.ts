import { Test, type TestingModule } from "@nestjs/testing";
import { OtaService } from "../ota/ota.service";
import { PrismaService } from "../prisma/prisma.service";

describe("OTA monitor/alerts", () => {
  let moduleRef: TestingModule;
  let service: OtaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        OtaService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get(OtaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("returns monitor shape", async () => {
    const res = service.monitor();
    expect(Array.isArray(res)).toBe(true);
  });

  it("returns alerts thresholds shape", async () => {
    const res = service.alerts();
    expect(res).toMatchObject({
      thresholds: expect.any(Object),
      freshnessBreaches: expect.any(Array),
      webhookBreaches: expect.any(Array),
    });
  });
});
