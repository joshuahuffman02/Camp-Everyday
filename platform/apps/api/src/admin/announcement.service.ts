import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type AnnouncementType = "info" | "warning" | "success";
type AnnouncementTarget = "all" | "admins" | "campground";

@Injectable()
export class AnnouncementService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(status?: string) {
        return this.prisma.announcement.findMany({
            where: status ? { status: status as any } : undefined,
            orderBy: { createdAt: "desc" },
        });
    }

    async findOne(id: string) {
        const announcement = await this.prisma.announcement.findUnique({ where: { id } });
        if (!announcement) throw new NotFoundException("Announcement not found");
        return announcement;
    }

    async create(data: {
        title: string;
        message: string;
        type?: AnnouncementType;
        target?: AnnouncementTarget;
        campgroundId?: string;
        scheduledAt?: Date;
        createdById: string;
        createdByEmail?: string;
    }) {
        return this.prisma.announcement.create({ data: data as any });
    }

    async update(id: string, data: {
        title?: string;
        message?: string;
        type?: AnnouncementType;
        target?: AnnouncementTarget;
        campgroundId?: string;
        scheduledAt?: Date;
    }) {
        return this.prisma.announcement.update({
            where: { id },
            data: data as any,
        });
    }

    async send(id: string) {
        return this.prisma.announcement.update({
            where: { id },
            data: {
                status: "sent",
                sentAt: new Date(),
            },
        });
    }

    async delete(id: string) {
        return this.prisma.announcement.delete({ where: { id } });
    }
}
