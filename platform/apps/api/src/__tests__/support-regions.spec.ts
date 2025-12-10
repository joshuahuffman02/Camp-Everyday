// @ts-nocheck
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
// @ts-ignore nest types resolution in test runner
import type { INestApplication } from '@nestjs/common';
// @ts-ignore nest types resolution in test runner
import { ValidationPipe } from '@nestjs/common';
import { SupportController } from '../support/support.controller';
import { SupportService } from '../support/support.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailService } from '../email/email.service';
import { ScopeGuard } from '../permissions/scope.guard';
import { PermissionsService } from '../permissions/permissions.service';

// Covers region filter, region-scoped assignment, and staff directory endpoint (stub notify handled client-side)

describe('Support regions & directory', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const campgroundId = 'camp-support-test';
  const userA = 'user-a'; // region north
  const userB = 'user-b'; // region south
  const adminUser = 'admin-user';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        SupportService,
        PrismaService,
        {
          provide: EmailService,
          useValue: { sendEmail: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: PermissionsService,
          useValue: { checkAccess: async () => ({ allowed: true }), isPlatformStaff: () => true },
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ sendEmail: jest.fn().mockResolvedValue(true) })
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
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: 'admin-user', role: 'owner', region: 'north' };
      next();
    });
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.organization.upsert({ where: { id: 'org-support' }, update: {}, create: { id: 'org-support', name: 'Org Support' } });
    await prisma.user.upsert({
      where: { id: adminUser },
      update: {},
      create: { id: adminUser, email: 'admin@test.com', passwordHash: 'x', firstName: 'Admin', lastName: 'User', region: 'north', ownershipRoles: ['owner'] }
    });
    await prisma.user.upsert({
      where: { id: userA },
      update: {},
      create: { id: userA, email: 'a@test.com', passwordHash: 'x', firstName: 'A', lastName: 'North', region: 'north', ownershipRoles: [] }
    });
    await prisma.user.upsert({
      where: { id: userB },
      update: {},
      create: { id: userB, email: 'b@test.com', passwordHash: 'x', firstName: 'B', lastName: 'South', region: 'south', ownershipRoles: [] }
    });
    await prisma.campground.upsert({
      where: { id: campgroundId },
      update: {},
      create: { id: campgroundId, name: 'Support Camp', organizationId: 'org-support', city: 'X', state: 'Y', country: 'US', slug: 'support-camp' }
    });
  });

  afterAll(async () => {
    if (prisma?.supportReport?.deleteMany) {
      await prisma.supportReport.deleteMany({ where: { campgroundId } });
    }
    await prisma.campground.deleteMany({ where: { id: campgroundId } });
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
    await prisma.organization.deleteMany({ where: { id: 'org-support' } });
    await app.close();
  });

  it('filters reports by region and blocks cross-region assignment', async () => {
    const api = request(app.getHttpServer());

    // create two reports in different regions
    const rNorth = await api.post('/api/support/reports').send({ description: 'north issue', region: 'north', campgroundId }).expect(201);
    const rSouth = await api.post('/api/support/reports').send({ description: 'south issue', region: 'south', campgroundId }).expect(201);

    const listNorth = await api.get('/api/support/reports?region=north').expect(200);
    expect(listNorth.body.find((r: any) => r.id === rNorth.body.id)).toBeTruthy();
    expect(listNorth.body.find((r: any) => r.id === rSouth.body.id)).toBeFalsy();

    // attempt cross-region assignment should 403
    await api.patch(`/api/support/reports/${rSouth.body.id}`).send({ assigneeId: userA }).expect(403);
  });

  it('returns staff directory filtered by region', async () => {
    const api = request(app.getHttpServer());
    const all = await api.get('/api/support/reports/staff/directory').expect(200);
    expect(all.body.length).toBeGreaterThanOrEqual(2);
    const northOnly = await api.get('/api/support/reports/staff/directory?region=north').expect(200);
    expect(northOnly.body.length).toBeGreaterThanOrEqual(1);
    expect(northOnly.body.some((u: any) => u.region === 'south')).toBe(false);
  });
});
