import { SocialPlannerService } from './social-planner.service';

describe('SocialPlannerService', () => {
    const monday = new Date('2025-01-06T10:00:00Z');
    const anchor = new Date('2025-01-06T00:00:00.000Z');

    it('generates weekly ideas when none exist', async () => {
        const prismaStub: any = {
            socialWeeklyIdea: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'weekly-1', ...data })),
            },
            // unused in this call but required by ctor signatures in some methods
            site: { count: jest.fn() },
            reservation: { count: jest.fn() },
            event: { findMany: jest.fn() },
            promotion: { findMany: jest.fn() },
            socialSuggestion: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
            socialPost: { findMany: jest.fn() },
            socialTemplate: { findMany: jest.fn() },
            socialContentAsset: { findMany: jest.fn() },
            campground: { findMany: jest.fn() },
        };

        const service = new SocialPlannerService(prismaStub);
        // Force deterministic Monday
        jest.useFakeTimers().setSystemTime(monday);

        const result = await service.generateWeeklyIdeas('camp-1');

        expect(prismaStub.socialWeeklyIdea.create).toHaveBeenCalled();
        expect((result as any).campground.connect.id).toBe('camp-1');
        expect((result as any).generatedFor?.toISOString?.() || result.generatedFor).toBe(anchor.toISOString());

        jest.useRealTimers();
    });
});

