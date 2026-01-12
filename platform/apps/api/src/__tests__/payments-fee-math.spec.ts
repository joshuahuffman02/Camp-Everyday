import { Test, type TestingModule } from "@nestjs/testing";
import { PaymentsController } from "../payments/payments.controller";
import { ReservationsService } from "../reservations/reservations.service";
import { StripeService } from "../payments/stripe.service";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsReconciliationService } from "../payments/reconciliation.service";
import { IdempotencyService } from "../payments/idempotency.service";
import { GatewayConfigService } from "../payments/gateway-config.service";
import { ScopeGuard } from "../permissions/scope.guard";

describe("PaymentsController fee calculations", () => {
  let moduleRef: TestingModule;
  let controller: PaymentsController;

  const getComputeChargeAmounts = () => {
    const value = Reflect.get(controller, "computeChargeAmounts");
    if (typeof value !== "function") {
      throw new Error("Expected computeChargeAmounts to be a function");
    }
    return value;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: ReservationsService, useValue: {} },
        { provide: StripeService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: PaymentsReconciliationService, useValue: {} },
        { provide: IdempotencyService, useValue: {} },
        { provide: GatewayConfigService, useValue: {} },
      ],
    })
      .overrideGuard(ScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(PaymentsController);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("adds gateway pass-through percent + flat when enabled", () => {
    const computeChargeAmounts = getComputeChargeAmounts();
    const result = computeChargeAmounts.call(controller, {
      reservation: { balanceAmount: 10000, totalAmount: 10000, paidAmount: 0 },
      platformFeeMode: "absorb",
      applicationFeeCents: 300,
      gatewayFeeMode: "pass_through",
      gatewayFeePercentBasisPoints: 290,
      gatewayFeeFlatCents: 30,
    });

    expect(result.amountCents).toBe(10320);
    expect(result.platformPassThroughFeeCents).toBe(0);
    expect(result.gatewayPassThroughFeeCents).toBe(320);
  });

  it("caps amount to base + platform fee when pass-through", () => {
    const computeChargeAmounts = getComputeChargeAmounts();
    const result = computeChargeAmounts.call(controller, {
      reservation: { balanceAmount: 5000, totalAmount: 5000, paidAmount: 0 },
      platformFeeMode: "pass_through",
      applicationFeeCents: 300,
      gatewayFeeMode: "absorb",
      gatewayFeePercentBasisPoints: 0,
      gatewayFeeFlatCents: 0,
    });

    expect(result.amountCents).toBe(5300);
    expect(result.platformPassThroughFeeCents).toBe(300);
    expect(result.gatewayPassThroughFeeCents).toBe(0);
  });
});
