import { CanActivate, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PortfoliosController } from "../src/portfolios/portfolios.controller";
import { PortfoliosService } from "../src/portfolios/portfolios.service";
import { JwtAuthGuard } from "../src/auth/guards";

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe("Portfolio report API", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfoliosController],
      providers: [PortfoliosService, { provide: JwtAuthGuard, useClass: AllowGuard }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new AllowGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 and expected shape for a known portfolio", async () => {
    const res = await request(app.getHttpServer()).get("/portfolios/pf-continental/report");

    expect(res.status).toBe(200);
    expect(res.body.portfolioId).toBe("pf-continental");
    expect(res.body.homeCurrency).toEqual(expect.any(String));
    expect(Array.isArray(res.body.metrics)).toBe(true);
    expect(res.body.metrics.length).toBeGreaterThan(0);
    expect(res.body.metrics[0]).toEqual(
      expect.objectContaining({
        parkId: expect.any(String),
        currency: expect.any(String),
        occupancy: expect.any(Number),
        adr: expect.any(Number),
        revpar: expect.any(Number),
        revenueHome: expect.any(Number),
      })
    );
    expect(res.body.rollup).toEqual(
      expect.objectContaining({
        currency: expect.any(String),
        revenueHome: expect.any(Number),
        occupancy: expect.any(Number),
        adr: expect.any(Number),
        revpar: expect.any(Number),
      })
    );
    expect(res.body.recommendations).toBeDefined();
    expect(Array.isArray(res.body.recommendations) || res.body.recommendations === undefined).toBe(true);
  });

  it("falls back gracefully for an unknown portfolio id", async () => {
    const res = await request(app.getHttpServer()).get("/portfolios/does-not-exist/report");

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.portfolioId).toBeDefined();
  });
});


