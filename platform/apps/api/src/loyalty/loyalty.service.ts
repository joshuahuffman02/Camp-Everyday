import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(guestId: string) {
        const profile = await this.prisma.loyaltyProfile.findUnique({
            where: { guestId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!profile) {
            // Create profile if it doesn't exist (lazy creation)
            return this.createProfile(guestId);
        }

        return profile;
    }

    async createProfile(guestId: string) {
        return this.prisma.loyaltyProfile.create({
            data: {
                guestId,
            },
            include: {
                transactions: true,
            },
        });
    }

    async awardPoints(guestId: string, amount: number, reason: string) {
        let profile = await this.prisma.loyaltyProfile.findUnique({
            where: { guestId },
        });

        if (!profile) {
            profile = await this.createProfile(guestId);
        }

        const newBalance = profile.pointsBalance + amount;
        const newTier = this.calculateTier(newBalance);

        // Transactional update
        return this.prisma.$transaction(async (tx) => {
            await tx.pointsTransaction.create({
                data: {
                    profileId: profile.id,
                    amount,
                    reason,
                },
            });

            return tx.loyaltyProfile.update({
                where: { id: profile.id },
                data: {
                    pointsBalance: newBalance,
                    tier: newTier,
                },
            });
        });
    }

    calculateTier(points: number): string {
        if (points >= 10000) return 'Platinum';
        if (points >= 5000) return 'Gold';
        if (points >= 1000) return 'Silver';
        return 'Bronze';
    }
}
