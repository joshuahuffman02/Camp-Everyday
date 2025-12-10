import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePricingRuleDto } from "./dto/create-pricing-rule.dto";
import { randomUUID } from "crypto";

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  listByCampground(campgroundId: string) {
    return this.prisma.pricingRule.findMany({
      where: { campgroundId },
      orderBy: [{ isActive: "desc" }, { startDate: "asc" }, { createdAt: "desc" }]
    });
  }

  async create(campgroundId: string, dto: CreatePricingRuleDto) {
    const rule = await this.prisma.pricingRule.create({
      data: {
        ...dto,
        campgroundId,
        siteClassId: dto.siteClassId || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null
      }
    });
    await this.prisma.analyticsEvent.create({
      data: {
        sessionId: randomUUID(),
        eventName: "admin_pricing_change" as any,
        campground: { connect: { id: campgroundId } },
        metadata: { action: "create", ruleId: rule.id, label: dto.label, ruleType: dto.ruleType, percentAdjust: dto.percentAdjust, flatAdjust: dto.flatAdjust },
      },
    });
    return rule;
  }

  async update(id: string, dto: Partial<CreatePricingRuleDto>) {
    const exists = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Pricing rule not found");
    const rule = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...dto,
        siteClassId: dto.siteClassId === undefined ? undefined : dto.siteClassId || null,
        startDate: dto.startDate === undefined ? undefined : dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null
      }
    });
    await this.prisma.analyticsEvent.create({
      data: {
        sessionId: randomUUID(),
        eventName: "admin_pricing_change" as any,
        campground: exists.campgroundId ? { connect: { id: exists.campgroundId } } : undefined,
        metadata: { action: "update", ruleId: rule.id },
      },
    });
    return rule;
  }

  remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.pricingRule.findUnique({ where: { id } });
      const res = await tx.pricingRule.delete({ where: { id } });
      if (existing?.campgroundId) {
        await tx.analyticsEvent.create({
          data: {
            sessionId: randomUUID(),
            eventName: "admin_pricing_change" as any,
            campground: { connect: { id: existing.campgroundId } },
            metadata: { action: "delete", ruleId: id },
          },
        });
      }
      return res;
    });
  }
}
