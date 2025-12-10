// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { ReportsController } from "../reports/reports.controller";
import { ReportsService } from "../reports/reports.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("Reports exports smoke", () => {
  let app: any;
  const campgroundId = "camp-reports-test";
  const now = new Date().toISOString();
  const stubExports = [
    {
      id: "exp-1",
      campgroundId,
      type: "api",
      resource: "reports",
      status: "success",
      location: "csv",
      filters: { range: "last_30_days" },
      requestedById: "user-1",
      createdAt: now,
      completedAt: now
    }
  ];

  const prismaStub = {
    integrationExportJob: {
      findMany: jest.fn().mockResolvedValue(stubExports),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(stubExports.find((e) => e.id === where.id) || null);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: "exp-new",
          ...data
        });
      })
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReportsService,
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
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: "tester", role: "owner" };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("lists and queues report exports with filters", async () => {
    const api = request(app.getHttpServer());
    const list = await api.get(`/api/campgrounds/${campgroundId}/reports/exports`).expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body[0]).toMatchObject({ id: "exp-1", filters: { range: "last_30_days" } });

    const queued = await api
      .post(`/api/campgrounds/${campgroundId}/reports/exports`)
      .send({ filters: { range: "last_7_days", tab: "overview" }, format: "csv" })
      .expect(201);
    expect(queued.body.filters).toMatchObject({ range: "last_7_days", tab: "overview" });

    const rerun = await api.post(`/api/campgrounds/${campgroundId}/reports/exports/exp-1/rerun`).expect(201);
    expect(rerun.body.filters).toMatchObject({ range: "last_30_days" });
  });
});


