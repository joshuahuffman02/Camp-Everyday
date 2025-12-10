import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipType, GuestMembership, Prisma } from '@prisma/client';
import { addDays } from 'date-fns';

type GuestMembershipWithType = Prisma.GuestMembershipGetPayload<{
    include: { membershipType: true };
}>;

@Injectable()
export class MembershipsService {
    constructor(private prisma: PrismaService) { }

    // Membership Types
    async createType(campgroundId: string, data: any): Promise<MembershipType> {
        return this.prisma.membershipType.create({
            data: {
                ...data,
                campgroundId,
            },
        });
    }

    async findAllTypes(campgroundId: string): Promise<MembershipType[]> {
        return this.prisma.membershipType.findMany({
            where: { campgroundId },
            orderBy: { price: 'asc' },
        });
    }

    async updateType(id: string, data: any): Promise<MembershipType> {
        return this.prisma.membershipType.update({
            where: { id },
            data,
        });
    }

    async deleteType(id: string): Promise<MembershipType> {
        return this.prisma.membershipType.delete({
            where: { id },
        });
    }

    // Guest Memberships
    async purchaseMembership(guestId: string, membershipTypeId: string): Promise<GuestMembership> {
        const type = await this.prisma.membershipType.findUnique({ where: { id: membershipTypeId } });
        if (!type) throw new NotFoundException('Membership type not found');

        const startDate = new Date();
        const endDate = addDays(startDate, type.durationDays);

        return this.prisma.guestMembership.create({
            data: {
                guestId,
                membershipTypeId,
                startDate,
                endDate,
                purchaseAmount: type.price,
                status: 'active',
            },
        });
    }

    async getActiveMembershipByGuest(guestId: string): Promise<GuestMembership | null> {
        const now = new Date();
        return this.prisma.guestMembership.findFirst({
            where: {
                guestId,
                status: 'active',
                endDate: { gt: now },
            },
            include: { membershipType: true },
            orderBy: { endDate: 'desc' },
        });
    }

    async getActiveMembershipById(membershipId: string): Promise<GuestMembershipWithType | null> {
        const now = new Date();
        return this.prisma.guestMembership.findFirst({
            where: {
                id: membershipId,
                status: 'active',
                endDate: { gt: now },
            },
            include: { membershipType: true },
        });
    }

    async getGuestMemberships(guestId: string): Promise<GuestMembership[]> {
        return this.prisma.guestMembership.findMany({
            where: { guestId },
            include: { membershipType: true },
            orderBy: { startDate: 'desc' },
        });
    }
}
