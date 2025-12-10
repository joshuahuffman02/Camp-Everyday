import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { PrivacyModule } from '../privacy/privacy.module';
import { PrivacyService } from '../privacy/privacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';

// Minimal e2e-ish check: redaction on/off for audit list

describe('Audit redaction', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let auditService: AuditService;
  let privacyService: PrivacyService;
  const campgroundId = 'camp-audit-test';
  const actorId = 'user-audit';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule, PrivacyModule],
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
    // extra guard bypass to satisfy any remaining auth hooks
    app.useGlobalGuards(new (class implements CanActivate { canActivate() { return true; } })());
    await app.init();
    prisma = app.get(PrismaService);
    auditService = app.get(AuditService);
    privacyService = app.get(PrivacyService);

    // Ensure missing columns exist in the test DB (idempotent)
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformActive" boolean DEFAULT true`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformRole" text`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformRegion" text`
    );

    await prisma.organization.upsert({
      where: { id: 'org-audit' },
      update: {},
      create: { id: 'org-audit', name: 'Org Audit' },
    });
    await prisma.user.upsert({
      where: { id: actorId },
      update: {},
      create: {
        id: actorId,
        email: 'actor@example.com',
        passwordHash: 'hashed',
        firstName: 'Act',
        lastName: 'Or',
        isActive: true,
      },
    });
    await prisma.campground.upsert({
      where: { id: campgroundId },
      update: {},
      create: { id: campgroundId, name: 'Audit Camp', organizationId: 'org-audit', city: 'X', state: 'Y', country: 'US', slug: 'audit-camp' },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { campgroundId } });
    await prisma.privacySetting.deleteMany({ where: { campgroundId } });
    await prisma.campground.deleteMany({ where: { id: campgroundId } });
    await prisma.user.deleteMany({ where: { id: actorId } });
    await prisma.organization.deleteMany({ where: { id: 'org-audit' } });
    await app.close();
  });

  it('redacts when privacy is on, shows raw when off', async () => {
    // Seed an audit event
    await prisma.auditLog.create({
      data: {
        campgroundId,
        actorId,
        action: 'update',
        entity: 'guest',
        entityId: 'g1',
        before: { email: 'guest@example.com', phone: '555-123-1234' },
        after: { email: 'guest@example.com', phone: '555-123-1234' },
        createdAt: new Date(),
      },
    });

    // privacy on (default true)
    const redacted = await auditService.list({ campgroundId });
    expect(JSON.stringify(redacted)).toContain('***@redacted');
    expect(JSON.stringify(redacted)).toContain('***-***-****');

    // turn off redaction
    await privacyService.updateSettings(campgroundId, { redactPII: false });
    const raw = await auditService.list({ campgroundId });
    expect(JSON.stringify(raw)).toContain('guest@example.com');
    expect(JSON.stringify(raw)).toContain('555-123-1234');
  });
});
