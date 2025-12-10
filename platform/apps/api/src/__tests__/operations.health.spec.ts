// @ts-nocheck
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { OperationsController } from '../operations/operations.controller';
import { OperationsService } from '../operations/operations.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards';
import { GamificationService } from '../gamification/gamification.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ScopeGuard } from '../permissions/scope.guard';

describe('Operations health smoke', () => {
  let app: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OperationsController],
      providers: [
        OperationsService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: GamificationService,
          useValue: { recordEvent: jest.fn() },
        },
        {
          provide: PermissionsService,
          useValue: { checkAccess: async () => ({ allowed: true }), isPlatformStaff: () => true },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ops health shape', async () => {
    const api = request(app.getHttpServer());
    const res = await api
      .get('/api/operations/ops-health?campgroundId=camp-ops-health')
      .expect(200);

    expect(res.body.campgroundId).toBe('camp-ops-health');
    expect(res.body.autoTasking).toBeDefined();
    expect(Array.isArray(res.body.autoTasking.recentRuns)).toBe(true);
    expect(res.body.reorders).toBeDefined();
  });
});


