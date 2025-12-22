// @ts-nocheck
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { PaymentsController } from '../payments/payments.controller';
import { ReservationsService } from '../reservations/reservations.service';
import { StripeService } from '../payments/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsReconciliationService } from '../payments/reconciliation.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsService } from '../permissions/permissions.service';
import { ScopeGuard } from '../permissions/scope.guard';
import { IdempotencyService } from '../payments/idempotency.service';
import { GatewayConfigService } from '../payments/gateway-config.service';

describe('Payments finance smoke', () => {
  let app: any;
  const campgroundId = 'camp-finance-smoke';

  const payoutRows = [
    {
      id: 'po_1',
      campgroundId,
      stripePayoutId: 'po_stripe_1',
      stripeAccountId: 'acct_123',
      amountCents: 55000,
      feeCents: 1500,
      currency: 'usd',
      status: 'paid',
      createdAt: new Date().toISOString(),
      arrivalDate: new Date().toISOString(),
      lines: [
        {
          id: 'line_1',
          type: 'charge',
          amountCents: 40000,
          currency: 'usd',
          description: 'Booking payment',
          reservationId: 'resv_1',
          paymentIntentId: 'pi_1',
          chargeId: 'ch_1',
          balanceTransactionId: 'bt_1',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ];

  const disputeRows = [
    {
      id: 'disp_1',
      campgroundId,
      stripeDisputeId: 'dp_1',
      stripeChargeId: 'ch_2',
      stripePaymentIntentId: 'pi_2',
      reservationId: 'resv_2',
      payoutId: 'po_1',
      amountCents: 12000,
      currency: 'usd',
      reason: 'fraudulent',
      status: 'needs_response',
      evidenceDueBy: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: null,
    },
  ];

  const payoutFindMany = jest.fn().mockResolvedValue(payoutRows);
  const disputeFindMany = jest.fn().mockResolvedValue(disputeRows);
  const idempotencyMock = { withLock: async (_key: string, fn: any) => fn(), start: jest.fn(), complete: jest.fn(), fail: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: {},
        },
        {
          provide: StripeService,
          useValue: {},
        },
        {
          provide: PaymentsReconciliationService,
          useValue: {
            reconcilePayout: jest.fn(),
            upsertDispute: jest.fn(),
            sendAlert: jest.fn(),
            computeReconSummary: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            payout: { findMany: payoutFindMany },
            dispute: { findMany: disputeFindMany },
          },
        },
        {
          provide: PermissionsService,
          useValue: { checkAccess: async () => ({ allowed: true }), isPlatformStaff: () => true },
        },
        {
          provide: IdempotencyService,
          useValue: idempotencyMock,
        },
        {
          provide: GatewayConfigService,
          useValue: {
            getConfig: jest.fn().mockResolvedValue({
              gateway: 'stripe',
              mode: 'test',
              feeMode: 'absorb',
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // Inject a fake authenticated user with access to the campground
    app.use((req: any, _res: any, next: () => void) => {
      req.user = {
        id: 'tester',
        memberships: [{ campgroundId }],
        roles: ['finance'],
      };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists payouts with lines', async () => {
    const api = request(app.getHttpServer());
    const res = await api.get(`/api/campgrounds/${campgroundId}/payouts`).expect(200);

    expect(payoutFindMany).toHaveBeenCalledWith({
      where: { campgroundId, status: undefined },
      orderBy: { createdAt: 'desc' },
      include: { lines: true },
    });
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(payoutRows[0].id);
    expect(res.body[0].status).toBe('paid');
    expect(Array.isArray(res.body[0].lines)).toBe(true);
    expect(res.body[0].lines[0].amountCents).toBe(40000);
  });

  it('lists disputes with status and due dates', async () => {
    const api = request(app.getHttpServer());
    const res = await api.get(`/api/campgrounds/${campgroundId}/disputes`).expect(200);

    expect(disputeFindMany).toHaveBeenCalledWith({
      where: { campgroundId, status: undefined },
      orderBy: { createdAt: 'desc' },
    });
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].stripeDisputeId).toBe(disputeRows[0].stripeDisputeId);
    expect(res.body[0].status).toBe(disputeRows[0].status);
    expect(res.body[0].evidenceDueBy).toBe(disputeRows[0].evidenceDueBy);
  });
});


