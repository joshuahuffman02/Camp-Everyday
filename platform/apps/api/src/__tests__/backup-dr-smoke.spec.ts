// @ts-nocheck
import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { BackupController } from "../backup/backup.controller";
import { BackupService, BackupProvider } from "../backup/backup.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ScopeGuard } from "../permissions/scope.guard";
import { PermissionsService } from "../permissions/permissions.service";

describe("Backup/DR readiness endpoints", () => {
  let app: any;
  const campgroundId = "camp-backup-dr";
  const providerMock: jest.Mocked<BackupProvider> = {
    healthCheck: jest.fn(),
    getLatestBackup: jest.fn(),
    runRestoreDrill: jest.fn()
  };

  const prismaStub = {
    privacySetting: {
      findUnique: jest.fn()
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        BackupService,
        {
          provide: PrismaService,
          useValue: prismaStub
        },
        {
          provide: BackupProvider,
          useValue: providerMock
        },
        {
          provide: PermissionsService,
          useValue: { checkAccess: async () => ({ allowed: true }), isPlatformStaff: () => true }
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaStub.privacySetting.findUnique.mockResolvedValue({
      campgroundId,
      backupRetentionDays: 14
    });
    providerMock.healthCheck.mockResolvedValue({ ok: true, message: "ok" });
    providerMock.getLatestBackup.mockResolvedValue({
      lastBackupAt: new Date().toISOString(),
      location: "s3://test-bucket/snap",
      verifiedAt: new Date().toISOString()
    });
    providerMock.runRestoreDrill.mockResolvedValue({
      ok: true,
      verifiedAt: new Date().toISOString(),
      message: "restore verified"
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns backup status snapshot", async () => {
    const api = request(app.getHttpServer());
    const res = await api.get(`/api/campgrounds/${campgroundId}/backup/status`).expect(200);

    expect(res.body.retentionDays).toBe(14);
    expect(res.body.lastBackupLocation).toContain("s3://test-bucket");
    expect(res.body.restoreSimulation.status).toBe("idle");
    expect(res.body.status).toBe("healthy");
    expect(new Date(res.body.lastBackupAt).valueOf()).not.toBeNaN();
  });

  it("marks stale when beyond retention", async () => {
    providerMock.getLatestBackup.mockResolvedValueOnce({
      lastBackupAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      location: "s3://test-bucket/snap",
      verifiedAt: new Date().toISOString()
    });
    prismaStub.privacySetting.findUnique.mockResolvedValueOnce({
      campgroundId,
      backupRetentionDays: 10
    });

    const api = request(app.getHttpServer());
    const res = await api.get(`/api/campgrounds/${campgroundId}/backup/status`).expect(200);
    expect(res.body.status).toBe("stale");
  });

  it("propagates provider errors", async () => {
    providerMock.getLatestBackup.mockRejectedValueOnce(new Error("provider down"));
    const api = request(app.getHttpServer());
    await api.get(`/api/campgrounds/${campgroundId}/backup/status`).expect(500);
  });

  it("runs restore simulation and updates status", async () => {
    const api = request(app.getHttpServer());

    const sim = await api.post(`/api/campgrounds/${campgroundId}/backup/restore-sim`).expect(201);
    expect(sim.body.restoreSimulation.status).toBe("ok");
    expect(sim.body.retentionDays).toBe(14);
    expect(sim.body.lastRestoreDrillAt).toBeTruthy();

    // status call is stateless; just ensure it succeeds
    await api.get(`/api/campgrounds/${campgroundId}/backup/status`).expect(200);
  });

  it("fails when no backup is present", async () => {
    providerMock.getLatestBackup.mockResolvedValueOnce({
      lastBackupAt: null,
      location: null,
      verifiedAt: null
    });
    const api = request(app.getHttpServer());
    await api.get(`/api/campgrounds/${campgroundId}/backup/status`).expect(503);
  });

  it("fails restore when provider fails", async () => {
    providerMock.runRestoreDrill.mockResolvedValueOnce({
      ok: false,
      verifiedAt: null,
      message: "restore failed"
    });
    const api = request(app.getHttpServer());
    await api.post(`/api/campgrounds/${campgroundId}/backup/restore-sim`).expect(503);
  });
});

