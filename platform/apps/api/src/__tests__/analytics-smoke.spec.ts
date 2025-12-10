// @ts-nocheck
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AnalyticsController } from '../analytics/analytics.controller';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('Analytics smoke', () => {
  let app: any;
  let prisma: PrismaService;
  const campgroundId = 'camp-analytics-test';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        AnalyticsService,
        PrismaService,
        {
          provide: AuditService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: 'analytics-user', role: 'owner' };
      req.campgroundId = campgroundId;
      next();
    });
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.organization.upsert({ where: { id: 'org-analytics' }, update: {}, create: { id: 'org-analytics', name: 'Org Analytics' } });
    await prisma.campground.upsert({
      where: { id: campgroundId },
      update: {},
      create: { id: campgroundId, name: 'Analytics Camp', organizationId: 'org-analytics', city: 'X', state: 'Y', country: 'US', slug: 'analytics-camp' },
    });
  });

  afterAll(async () => {
    await prisma.campground.deleteMany({ where: { id: campgroundId } });
    await prisma.organization.deleteMany({ where: { id: 'org-analytics' } });
    await app.close();
  });

  it('ingests an event and returns recommendations (stub)', async () => {
    const api = request(app.getHttpServer());
    await api
      .post('/api/analytics/events')
      .send({
        sessionId: 'sess-1',
        eventName: 'page_view',
        occurredAt: new Date().toISOString(),
        campgroundId,
        deviceType: 'desktop',
        metadata: { siteId: 'site-1' },
      })
      .expect(201);

    const recs = await api.get('/api/analytics/recommendations?campgroundId=' + campgroundId).expect(200);
    expect(Array.isArray(recs.body?.recommendations || recs.body)).toBe(true);
  });
});

