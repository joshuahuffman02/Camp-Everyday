import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import { PrivacyModule } from '../privacy/privacy.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';

// Note: uses in-memory Nest app; DB must be available.
describe('Privacy & Permissions APIs (e2e-ish)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const campgroundId = 'camp-pp-test';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrivacyModule, PermissionsModule],
      providers: [PrismaService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Seed org + campground and privacy defaults
    await prisma.organization.upsert({
      where: { id: "org-test" },
      update: {},
      create: { id: "org-test", name: "Org Test" },
    });
    await prisma.campground.upsert({
      where: { id: campgroundId },
      update: {},
      create: {
        id: campgroundId,
        name: 'Privacy Test Camp',
        organizationId: 'org-test',
        city: 'Test',
        state: 'TS',
        country: 'US',
        slug: 'privacy-test',
      },
    });
    await prisma.approvalPolicy.upsert({
      where: { campgroundId_action: { campgroundId, action: 'export_pii' } },
      update: {},
      create: {
        campgroundId,
        action: 'export_pii',
        resource: 'pii',
        approverRoles: ['owner'],
      },
    });
  });

  afterAll(async () => {
    await prisma.consentLog.deleteMany({ where: { campgroundId } });
    await prisma.privacySetting.deleteMany({ where: { campgroundId } });
    await prisma.approvalRequest.deleteMany({ where: { campgroundId } });
    await prisma.auditLog.deleteMany({ where: { campgroundId } });
    await prisma.campground.deleteMany({ where: { id: campgroundId } });
    await app.close();
  });

  it('updates privacy settings and logs consent', async () => {
    const api = request(app.getHttpServer());

    const settingsRes = await api
      .post(`/api/campgrounds/${campgroundId}/privacy`)
      .send({ redactPII: true, consentRequired: true, backupRetentionDays: 15, keyRotationDays: 45 })
      .expect(201);

    expect(settingsRes.body.backupRetentionDays).toBe(15);

    const consentRes = await api
      .post(`/api/campgrounds/${campgroundId}/privacy/consents`)
      .send({ subject: 'guest@example.com', consentType: 'marketing', grantedBy: 'tester' })
      .expect(201);

    expect(consentRes.body.consentType).toBe('marketing');

    const listRes = await api.get(`/api/campgrounds/${campgroundId}/privacy/consents`).expect(200);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it('creates and lists approval requests (auto-approved stub)', async () => {
    const api = request(app.getHttpServer());

    const createRes = await api
      .post('/api/permissions/approvals')
      .send({ action: 'export_pii', requestedBy: 'tester', campgroundId })
      .expect(201);

    expect(createRes.body.status).toBe('approved');

    const listRes = await api.get('/api/permissions/approvals').expect(200);
    expect(listRes.body.find((a: any) => a.id === createRes.body.id)).toBeTruthy();
  });
});
