import { TaxRulesService } from './tax-rules.service';
import { NotFoundException } from '@nestjs/common';

describe('TaxRulesService', () => {
  let service: TaxRulesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      taxRule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new TaxRulesService(mockPrisma);
  });

  describe('evaluateExemption', () => {
    describe('basic eligibility', () => {
      it('should return not eligible when no exemption rules exist', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([]);

        const result = await service.evaluateExemption('cg-1', 10, true);

        expect(result.eligible).toBe(false);
        expect(result.applied).toBe(false);
        expect(result.rule).toBeNull();
      });

      it('should return eligible and applied for simple exemption', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Long Stay Exemption',
            type: 'exemption',
            minNights: null,
            maxNights: null,
            requiresWaiver: false,
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 5, false);

        expect(result.eligible).toBe(true);
        expect(result.applied).toBe(true);
        expect(result.rule.id).toBe('rule-1');
      });
    });

    describe('night-based constraints', () => {
      it('should apply when nights meet minimum requirement', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: '30+ Night Exemption',
            type: 'exemption',
            minNights: 30,
            maxNights: null,
            requiresWaiver: false,
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 30, false);

        expect(result.eligible).toBe(true);
        expect(result.applied).toBe(true);
      });

      it('should not apply when nights below minimum', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: '30+ Night Exemption',
            type: 'exemption',
            minNights: 30,
            maxNights: null,
            requiresWaiver: false,
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 29, false);

        expect(result.eligible).toBe(false);
        expect(result.applied).toBe(false);
      });

      it('should apply when nights within max limit', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Short Stay Exemption',
            type: 'exemption',
            minNights: null,
            maxNights: 7,
            requiresWaiver: false,
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 5, false);

        expect(result.eligible).toBe(true);
        expect(result.applied).toBe(true);
      });

      it('should not apply when nights exceed maximum', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Short Stay Exemption',
            type: 'exemption',
            minNights: null,
            maxNights: 7,
            requiresWaiver: false,
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 10, false);

        expect(result.eligible).toBe(false);
        expect(result.applied).toBe(false);
      });

      it('should apply when nights within range (min and max)', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Mid-Stay Exemption',
            type: 'exemption',
            minNights: 7,
            maxNights: 30,
            requiresWaiver: false,
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 14, false);

        expect(result.eligible).toBe(true);
        expect(result.applied).toBe(true);
      });

      it('should apply at exact boundary values', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Range Exemption',
            type: 'exemption',
            minNights: 7,
            maxNights: 30,
            requiresWaiver: false,
          },
        ]);

        // At min boundary
        const resultMin = await service.evaluateExemption('cg-1', 7, false);
        expect(resultMin.eligible).toBe(true);

        // At max boundary
        const resultMax = await service.evaluateExemption('cg-1', 30, false);
        expect(resultMax.eligible).toBe(true);
      });
    });

    describe('waiver requirements', () => {
      it('should apply exemption when waiver required and signed', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Waiver Required Exemption',
            type: 'exemption',
            minNights: null,
            maxNights: null,
            requiresWaiver: true,
            waiverText: 'I certify this is my primary residence',
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 30, true);

        expect(result.eligible).toBe(true);
        expect(result.applied).toBe(true);
      });

      it('should be eligible but not applied when waiver required but not signed', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Waiver Required Exemption',
            type: 'exemption',
            minNights: null,
            maxNights: null,
            requiresWaiver: true,
            waiverText: 'I certify this is my primary residence',
          },
        ]);

        const result = await service.evaluateExemption('cg-1', 30, false);

        expect(result.eligible).toBe(true);
        expect(result.applied).toBe(false);
        expect(result.reason).toBe('Waiver required');
      });
    });

    describe('multiple rules', () => {
      it('should apply first matching rule', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Rule 1 - 30+ nights',
            type: 'exemption',
            minNights: 30,
            maxNights: null,
            requiresWaiver: false,
          },
          {
            id: 'rule-2',
            name: 'Rule 2 - No restrictions',
            type: 'exemption',
            minNights: null,
            maxNights: null,
            requiresWaiver: false,
          },
        ]);

        // Should match rule-1 (30+ nights) first
        const result = await service.evaluateExemption('cg-1', 45, false);

        expect(result.rule.id).toBe('rule-1');
      });

      it('should fall through to next rule if first does not match', async () => {
        mockPrisma.taxRule.findMany.mockResolvedValue([
          {
            id: 'rule-1',
            name: 'Rule 1 - 30+ nights',
            type: 'exemption',
            minNights: 30,
            maxNights: null,
            requiresWaiver: false,
          },
          {
            id: 'rule-2',
            name: 'Rule 2 - 7+ nights',
            type: 'exemption',
            minNights: 7,
            maxNights: null,
            requiresWaiver: false,
          },
        ]);

        // 10 nights doesn't match rule-1 (needs 30), but matches rule-2
        const result = await service.evaluateExemption('cg-1', 10, false);

        expect(result.eligible).toBe(true);
        expect(result.rule.id).toBe('rule-2');
      });
    });
  });

  describe('CRUD operations', () => {
    describe('create', () => {
      it('should create tax rule with required fields', async () => {
        const data = {
          campgroundId: 'cg-1',
          name: 'State Tax',
          type: 'rate' as const,
          rate: 8.5,
        };
        mockPrisma.taxRule.create.mockResolvedValue({ id: 'rule-1', ...data });

        const result = await service.create(data);

        expect(result.id).toBe('rule-1');
        expect(mockPrisma.taxRule.create).toHaveBeenCalledWith({
          data: {
            campgroundId: 'cg-1',
            name: 'State Tax',
            type: 'rate',
            rate: 8.5,
            minNights: undefined,
            maxNights: undefined,
            requiresWaiver: false,
            waiverText: undefined,
          },
        });
      });

      it('should create exemption rule with waiver', async () => {
        const data = {
          campgroundId: 'cg-1',
          name: 'Extended Stay Exemption',
          type: 'exemption' as const,
          minNights: 30,
          requiresWaiver: true,
          waiverText: 'I certify this is my primary residence',
        };
        mockPrisma.taxRule.create.mockResolvedValue({ id: 'rule-1', ...data });

        await service.create(data);

        expect(mockPrisma.taxRule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            requiresWaiver: true,
            waiverText: 'I certify this is my primary residence',
          }),
        });
      });
    });

    describe('findOne', () => {
      it('should return tax rule when found', async () => {
        mockPrisma.taxRule.findUnique.mockResolvedValue({
          id: 'rule-1',
          name: 'State Tax',
        });

        const result = await service.findOne('rule-1');

        expect(result.name).toBe('State Tax');
      });

      it('should throw NotFoundException when not found', async () => {
        mockPrisma.taxRule.findUnique.mockResolvedValue(null);

        await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
        await expect(service.findOne('invalid-id')).rejects.toThrow('Tax rule not found');
      });
    });

    describe('update', () => {
      it('should update tax rule', async () => {
        mockPrisma.taxRule.update.mockResolvedValue({
          id: 'rule-1',
          rate: 9.0,
        });

        const result = await service.update('rule-1', { rate: 9.0 });

        expect(result.rate).toBe(9.0);
        expect(mockPrisma.taxRule.update).toHaveBeenCalledWith({
          where: { id: 'rule-1' },
          data: { rate: 9.0 },
        });
      });

      it('should update isActive status', async () => {
        mockPrisma.taxRule.update.mockResolvedValue({
          id: 'rule-1',
          isActive: false,
        });

        await service.update('rule-1', { isActive: false });

        expect(mockPrisma.taxRule.update).toHaveBeenCalledWith({
          where: { id: 'rule-1' },
          data: { isActive: false },
        });
      });
    });

    describe('remove', () => {
      it('should delete tax rule', async () => {
        mockPrisma.taxRule.delete.mockResolvedValue({ id: 'rule-1' });

        await service.remove('rule-1');

        expect(mockPrisma.taxRule.delete).toHaveBeenCalledWith({
          where: { id: 'rule-1' },
        });
      });
    });

    describe('findAllByCampground', () => {
      it('should list rules ordered by createdAt desc', async () => {
        const rules = [
          { id: 'rule-2', createdAt: new Date('2024-02-01') },
          { id: 'rule-1', createdAt: new Date('2024-01-01') },
        ];
        mockPrisma.taxRule.findMany.mockResolvedValue(rules);

        const result = await service.findAllByCampground('cg-1');

        expect(result).toHaveLength(2);
        expect(mockPrisma.taxRule.findMany).toHaveBeenCalledWith({
          where: { campgroundId: 'cg-1' },
          orderBy: { createdAt: 'desc' },
        });
      });
    });
  });
});
