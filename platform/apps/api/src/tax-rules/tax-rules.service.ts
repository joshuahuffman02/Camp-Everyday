import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxRuleType } from '@prisma/client';

@Injectable()
export class TaxRulesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: {
        campgroundId: string;
        name: string;
        type: TaxRuleType;
        rate?: number;
        minNights?: number;
        maxNights?: number;
        requiresWaiver?: boolean;
        waiverText?: string;
    }) {
        return this.prisma.taxRule.create({
            data: {
                campgroundId: data.campgroundId,
                name: data.name,
                type: data.type,
                rate: data.rate,
                minNights: data.minNights,
                maxNights: data.maxNights,
                requiresWaiver: data.requiresWaiver ?? false,
                waiverText: data.waiverText,
            },
        });
    }

    async findAllByCampground(campgroundId: string) {
        return this.prisma.taxRule.findMany({
            where: { campgroundId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const rule = await this.prisma.taxRule.findUnique({ where: { id } });
        if (!rule) throw new NotFoundException('Tax rule not found');
        return rule;
    }

    async update(id: string, data: Partial<{
        name: string;
        type: TaxRuleType;
        rate: number;
        minNights: number;
        maxNights: number;
        requiresWaiver: boolean;
        waiverText: string;
        isActive: boolean;
    }>) {
        return this.prisma.taxRule.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        const existing = await this.prisma.taxRule.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException('Tax rule not found');
        }

        return this.prisma.taxRule.delete({ where: { id } });
    }

    // Evaluate applicable tax exemption for a reservation
    async evaluateExemption(campgroundId: string, nights: number, waiverSigned: boolean) {
        const rules = await this.prisma.taxRule.findMany({
            where: {
                campgroundId,
                type: 'exemption',
                isActive: true,
            },
        });

        for (const rule of rules) {
            const meetsMinNights = rule.minNights ? nights >= rule.minNights : true;
            const meetsMaxNights = rule.maxNights ? nights <= rule.maxNights : true;

            if (meetsMinNights && meetsMaxNights) {
                if (rule.requiresWaiver && !waiverSigned) {
                    // Eligible but waiver not signed
                    return { eligible: true, applied: false, rule, reason: 'Waiver required' };
                }
                return { eligible: true, applied: true, rule };
            }
        }

        return { eligible: false, applied: false, rule: null };
    }
}
