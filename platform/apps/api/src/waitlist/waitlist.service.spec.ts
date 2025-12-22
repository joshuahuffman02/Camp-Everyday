import { WaitlistService } from './waitlist.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let mockPrisma: any;
  let mockEmailService: any;
  let mockIdempotency: any;
  let mockObservability: any;

  beforeEach(() => {
    mockPrisma = {
      waitlistEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockIdempotency = {
      start: jest.fn().mockResolvedValue(null),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
      findBySequence: jest.fn().mockResolvedValue(null),
    };

    mockObservability = {
      recordOfferLag: jest.fn(),
    };

    service = new WaitlistService(mockPrisma, mockEmailService, mockIdempotency, mockObservability);
  });

  describe('calculatePriorityScore', () => {
    const calculatePriorityScore = (entry: any, freedArrival: Date, freedDeparture: Date) => {
      return (service as any).calculatePriorityScore(entry, freedArrival, freedDeparture);
    };

    const freedArrival = new Date('2024-06-15');
    const freedDeparture = new Date('2024-06-20');

    describe('base priority', () => {
      it('should use entry priority as base score', () => {
        const entry = { priority: 75, createdAt: new Date() };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.score).toBeGreaterThanOrEqual(75);
        expect(result.reasons).toContain('Base priority: 75');
      });

      it('should default to 50 when no priority set', () => {
        const entry = { priority: null, createdAt: new Date() };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Base priority: 50');
      });
    });

    describe('loyalty bonus', () => {
      it('should add loyalty bonus for returning guests', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          guest: { reservationCount: 5 },
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Loyalty bonus: +25 (5 stays)');
      });

      it('should cap loyalty bonus at 25', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          guest: { reservationCount: 100 },
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Loyalty bonus: +25 (100 stays)');
      });

      it('should not add loyalty bonus for new guests', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          guest: { reservationCount: 0 },
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons.some((r: string) => r.includes('Loyalty'))).toBe(false);
      });
    });

    describe('date matching', () => {
      it('should add 30 points for exact date match', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          arrivalDate: freedArrival,
          departureDate: freedDeparture,
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Exact date match: +30');
      });

      it('should add 10 points for date overlap', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          arrivalDate: new Date('2024-06-14'),
          departureDate: new Date('2024-06-18'),
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Date overlap: +10');
      });
    });

    describe('site preference', () => {
      it('should add 15 points for specific site preference', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          siteId: 'site-123',
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Specific site preference: +15');
      });
    });

    describe('wait time bonus', () => {
      it('should add points based on wait time', () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const entry = {
          priority: 50,
          createdAt: thirtyDaysAgo,
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons.some((r: string) => r.includes('Wait time bonus'))).toBe(true);
      });

      it('should cap wait time bonus at 30', () => {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const entry = {
          priority: 50,
          createdAt: sixtyDaysAgo,
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Wait time bonus: +30 (60 days)');
      });
    });

    describe('price flexibility', () => {
      it('should add 10 points for maxPrice flexibility', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          maxPrice: 15000,
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Price flexibility: +10');
      });
    });

    describe('auto-offer bonus', () => {
      it('should add 20 points for auto-offer enabled', () => {
        const entry = {
          priority: 50,
          createdAt: new Date(),
          autoOffer: true,
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);
        expect(result.reasons).toContain('Auto-offer enabled: +20');
      });
    });

    describe('combined scoring', () => {
      it('should stack all bonuses correctly', () => {
        const entry = {
          priority: 100,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          guest: { reservationCount: 3 },
          arrivalDate: freedArrival,
          departureDate: freedDeparture,
          siteId: 'site-1',
          maxPrice: 20000,
          autoOffer: true,
        };
        const result = calculatePriorityScore(entry, freedArrival, freedDeparture);

        // 100 base + 15 loyalty + 30 exact match + 15 site + 10 wait + 10 price + 20 auto = 200
        expect(result.score).toBeGreaterThanOrEqual(190);
      });
    });
  });

  describe('checkWaitlist', () => {
    it('should find matching waitlist entries', async () => {
      const entries = [
        { id: 'entry-1', priority: 80, createdAt: new Date() },
        { id: 'entry-2', priority: 50, createdAt: new Date() },
      ];
      mockPrisma.waitlistEntry.findMany.mockResolvedValue(entries);

      const result = await service.checkWaitlist(
        'cg-1',
        new Date('2024-06-15'),
        new Date('2024-06-20'),
        'site-1',
        'class-1'
      );

      expect(result).toHaveLength(2);
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    });

    it('should return entries sorted by score descending', async () => {
      const entries = [
        { id: 'entry-low', priority: 10, createdAt: new Date() },
        { id: 'entry-high', priority: 90, createdAt: new Date() },
      ];
      mockPrisma.waitlistEntry.findMany.mockResolvedValue(entries);

      const result = await service.checkWaitlist(
        'cg-1',
        new Date('2024-06-15'),
        new Date('2024-06-20'),
        'site-1'
      );

      expect(result[0].entry.id).toBe('entry-high');
      expect(result[1].entry.id).toBe('entry-low');
    });
  });

  describe('getStats', () => {
    it('should aggregate waitlist stats', async () => {
      mockPrisma.waitlistEntry.count
        .mockResolvedValueOnce(10) // active
        .mockResolvedValueOnce(5)  // offered
        .mockResolvedValueOnce(3)  // converted
        .mockResolvedValueOnce(2)  // fulfilled
        .mockResolvedValueOnce(1)  // expired
        .mockResolvedValueOnce(1); // cancelled

      const result = await service.getStats('cg-1');

      expect(result).toEqual({
        active: 10,
        offered: 5,
        converted: 5,  // converted + fulfilled
        expired: 2,    // expired + cancelled
        total: 22,
      });
    });
  });

  describe('expireOldEntries', () => {
    it('should expire entries older than threshold', async () => {
      mockPrisma.waitlistEntry.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.expireOldEntries('cg-1', 90);

      expect(result).toBe(5);
      expect(mockPrisma.waitlistEntry.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          campgroundId: 'cg-1',
          status: 'active',
        }),
        data: { status: 'expired' },
      });
    });

    it('should use default 90 days threshold', async () => {
      mockPrisma.waitlistEntry.updateMany.mockResolvedValue({ count: 0 });

      await service.expireOldEntries('cg-1');

      expect(mockPrisma.waitlistEntry.updateMany).toHaveBeenCalled();
    });
  });

  describe('markConverted', () => {
    it('should mark entry as converted with reservation ID', async () => {
      mockPrisma.waitlistEntry.update.mockResolvedValue({
        id: 'entry-1',
        status: 'converted',
        convertedReservationId: 'res-123',
      });

      await service.markConverted('entry-1', 'res-123');

      expect(mockPrisma.waitlistEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: {
          status: 'converted',
          convertedReservationId: 'res-123',
          convertedAt: expect.any(Date),
        },
      });
    });
  });

  describe('CRUD operations', () => {
    it('should list entries for campground', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);

      await service.findAll('cg-1');

      expect(mockPrisma.waitlistEntry.findMany).toHaveBeenCalledWith({
        where: { campgroundId: 'cg-1' },
        include: { guest: true, site: true, siteClass: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by type when provided', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);

      await service.findAll('cg-1', 'seasonal');

      expect(mockPrisma.waitlistEntry.findMany).toHaveBeenCalledWith({
        where: { campgroundId: 'cg-1', type: 'seasonal' },
        include: { guest: true, site: true, siteClass: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should remove entry', async () => {
      mockPrisma.waitlistEntry.delete.mockResolvedValue({ id: 'entry-1' });

      await service.remove('entry-1');

      expect(mockPrisma.waitlistEntry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
      });
    });
  });
});
