// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { SupportController } from "../support/support.controller";
import { SupportService } from "../support/support.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { JwtAuthGuard } from "../auth/guards";
import { ScopeGuard } from "../permissions/scope.guard";

describe("Support reports smoke", () => {
  let app: any;
  let prisma: any;
  const campgroundId = "camp-support-smoke";

  beforeAll(async () => {
    const prismaMock = {
      supportReport: {
        findMany: jest.fn()
      }
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        SupportService,
        {
          provide: PrismaService,
          useValue: prismaMock
        },
        {
          provide: EmailService,
          useValue: { sendEmail: jest.fn().mockResolvedValue(true) }
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: "support-user", role: "support", region: "north" };
      next();
    });
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns region + campground scoped support reports", async () => {
    const sample = [
      {
        id: "r-1",
        rawContext: { region: "north" },
        campgroundId,
        status: "open"
      }
    ];
    prisma.supportReport.findMany.mockResolvedValue(sample);

    const api = request(app.getHttpServer());
    const res = await api
      .get(`/api/support/reports?region=north&campgroundId=${campgroundId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]?.id).toBe("r-1");

    expect(prisma.supportReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([
            expect.objectContaining({
              rawContext: expect.objectContaining({
                path: ["region"],
                equals: "north"
              })
            }),
            expect.objectContaining({ campgroundId })
          ])
        },
        orderBy: { createdAt: "desc" },
        include: expect.any(Object)
      })
    );
  });
});

