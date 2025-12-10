import { CommunicationsController } from '../src/communications/communications.controller';

describe('Communications smoke (approvals & playbooks)', () => {
  const emailService = { sendEmail: jest.fn() };
  const smsService = { sendSms: jest.fn() };
  let controller: CommunicationsController;
  let prisma: any;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma = {
      communicationTemplate: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      communicationPlaybook: {
        findUnique: jest.fn(),
      },
      communicationPlaybookJob: {
        update: jest.fn(),
      },
      reservation: {
        findUnique: jest.fn(),
      },
      guest: {
        findUnique: jest.fn(),
      },
    };
    controller = new CommunicationsController(prisma as any, emailService as any, smsService as any);
    process.env.EMAIL_SENDER_DOMAINS = 'allowed.com';
  });

  it('rejects outbound email when sender domain is not allowed', async () => {
    await expect(
      controller.send({
        campgroundId: 'cg1',
        guestId: 'g1',
        reservationId: null,
        type: 'email',
        direction: 'outbound',
        toAddress: 'user@example.com',
        fromAddress: 'bad@notallowed.com',
        body: 'hi',
      } as any)
    ).rejects.toThrow(/Unverified sender domain/);
    expect(prisma.communication?.create).toBeUndefined();
  });

  it('appends audit log on template update when fields change', async () => {
    const existing = { id: 't1', campgroundId: 'cg1', name: 'Old', subject: 'S', bodyHtml: '<p>a</p>', status: 'draft', auditLog: [] };
    prisma.communicationTemplate.findUnique.mockResolvedValue(existing);
    prisma.communicationTemplate.update.mockImplementation(({ data }: any) => data);

    const updated = await controller.updateTemplate(
      't1',
      { name: 'New name' } as any,
      'cg1'
    );

    expect(prisma.communicationTemplate.update).toHaveBeenCalled();
    expect(updated.auditLog?.length).toBe(1);
    expect(updated.auditLog?.[0]?.action).toBe('updated');
    expect(updated.name).toBe('New name');
  });

  it('reschedules playbook job during quiet hours', async () => {
    // Force quiet hours path
    (controller as any).isQuietHours = () => true;
    prisma.communicationPlaybook.findUnique.mockResolvedValue({
      id: 'pb1',
      enabled: true,
      channel: 'email',
      campground: {},
      template: { status: 'approved', subject: 'Hi', bodyHtml: '<p>hi</p>' },
    });
    prisma.communicationPlaybookJob.update.mockResolvedValue({});

    await (controller as any).processJob({
      id: 'job1',
      playbookId: 'pb1',
      attempts: 0,
      reservationId: null,
      guestId: null,
    });

    expect(prisma.communicationPlaybookJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job1' },
        data: expect.objectContaining({
          scheduledAt: expect.any(Date),
          attempts: 1,
        }),
      })
    );
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('sends playbook email when not in quiet hours', async () => {
    (controller as any).isQuietHours = () => false;
    prisma.communicationPlaybook.findUnique.mockResolvedValue({
      id: 'pb1',
      enabled: true,
      channel: 'email',
      campground: {},
      template: { status: 'approved', subject: 'Hi', bodyHtml: '<p>hi</p>' },
    });
    prisma.reservation.findUnique.mockResolvedValue({
      id: 'r1',
      guest: { email: 'user@example.com' },
    });
    prisma.communicationPlaybookJob.update.mockResolvedValue({});

    await (controller as any).processJob({
      id: 'job1',
      playbookId: 'pb1',
      attempts: 0,
      reservationId: 'r1',
    });

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' })
    );
    expect(prisma.communicationPlaybookJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job1' },
        data: expect.objectContaining({ status: 'sent' }),
      })
    );
  });
});

