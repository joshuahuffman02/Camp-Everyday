import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type FeatureFlagScope = "global" | "campground";

@Injectable()
export class FeatureFlagService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.featureFlag.findMany({
            orderBy: { name: "asc" },
        });
    }

    async findOne(id: string) {
        const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
        if (!flag) throw new NotFoundException("Feature flag not found");
        return flag;
    }

    async findByKey(key: string) {
        return this.prisma.featureFlag.findUnique({ where: { key } });
    }

    async create(data: {
        key: string;
        name: string;
        description?: string;
        enabled?: boolean;
        scope?: FeatureFlagScope;
        campgrounds?: string[];
    }) {
        return this.prisma.featureFlag.create({ data: data as any });
    }

    async update(id: string, data: {
        name?: string;
        description?: string;
        enabled?: boolean;
        scope?: FeatureFlagScope;
        campgrounds?: string[];
    }) {
        return this.prisma.featureFlag.update({
            where: { id },
            data: data as any,
        });
    }

    async toggle(id: string) {
        const flag = await this.findOne(id);
        return this.prisma.featureFlag.update({
            where: { id },
            data: { enabled: !flag.enabled },
        });
    }

    async delete(id: string) {
        return this.prisma.featureFlag.delete({ where: { id } });
    }

    async isEnabled(key: string, campgroundId?: string): Promise<boolean> {
        const flag = await this.findByKey(key);
        if (!flag) return false;
        if (!flag.enabled) return false;
        if (flag.scope === "global") return true;
        if (flag.scope === "campground" && campgroundId) {
            return flag.campgrounds.includes(campgroundId);
        }
        return false;
    }
}
