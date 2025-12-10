// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { GiftCardsController } from "../gift-cards/gift-cards.controller";
import { GiftCardsService } from "../gift-cards/gift-cards.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("Gift cards & store credit redeem smoke", () => {
  let app: any;
  let service: GiftCardsService;

  const prisma = {
    giftCard: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    giftCardTransaction: {
      create: jest.fn()
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GiftCardsController],
      providers: [
        GiftCardsService,
        {
          provide: PrismaService,
          useValue: prisma
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
    service = moduleRef.get(GiftCardsService);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service.seedInMemory([
      { code: "CARD-BOOK-100", balanceCents: 10000, kind: "gift_card" },
      { code: "CREDIT-POS-20", balanceCents: 2000, kind: "store_credit" }
    ]);
    prisma.giftCard.update.mockResolvedValue({});
    prisma.giftCardTransaction.create.mockResolvedValue({});
  });

  afterAll(async () => {
    await app.close();
  });

  it("redeems gift card against booking endpoint and updates balance", async () => {
    const api = request(app.getHttpServer());

    const res = await api
      .post("/api/bookings/booking-1/gift-cards/redeem")
      .send({ code: "CARD-BOOK-100", amountCents: 2500 })
      .expect(200);

    expect(res.body.balanceCents).toBe(7500);
    expect(service.getBalance("CARD-BOOK-100")).toBe(7500);
    expect(prisma.giftCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: "CARD-BOOK-100" },
        data: expect.objectContaining({ balanceCents: 7500 })
      })
    );
  });

  it("redeems store credit against POS endpoint and updates balance", async () => {
    const api = request(app.getHttpServer());

    const res = await api
      .post("/api/pos/orders/order-99/gift-cards/redeem")
      .send({ code: "CREDIT-POS-20", amountCents: 1500 })
      .expect(200);

    expect(res.body.balanceCents).toBe(500);
    expect(service.getBalance("CREDIT-POS-20")).toBe(500);
    expect(prisma.giftCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: "CREDIT-POS-20" },
        data: expect.objectContaining({ balanceCents: 500 })
      })
    );
    expect(prisma.giftCardTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "CREDIT-POS-20",
          amountCents: 1500,
          channel: "pos",
          referenceId: "order-99"
        })
      })
    );
  });
});

