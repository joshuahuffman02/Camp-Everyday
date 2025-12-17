import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, DonationStatus, CharityPayoutStatus } from "@prisma/client";

// DTOs
export interface CreateCharityDto {
  name: string;
  description?: string;
  logoUrl?: string;
  taxId?: string;
  website?: string;
  category?: string;
}

export interface UpdateCharityDto extends Partial<CreateCharityDto> {
  isActive?: boolean;
  isVerified?: boolean;
}

export interface SetCampgroundCharityDto {
  charityId: string;
  isEnabled?: boolean;
  customMessage?: string;
  roundUpType?: string;
  roundUpOptions?: { values: number[] };
  defaultOptIn?: boolean;
}

export interface CreateDonationDto {
  reservationId: string;
  charityId: string;
  campgroundId: string;
  guestId?: string;
  amountCents: number;
}

export interface CharityStats {
  totalDonations: number;
  totalAmountCents: number;
  donorCount: number;
  optInRate: number;
  averageDonationCents: number;
  byStatus: { status: string; count: number; amountCents: number }[];
}

@Injectable()
export class CharityService {
  constructor(private prisma: PrismaService) {}

  // ==========================================================================
  // CHARITY CRUD (Platform Admin)
  // ==========================================================================

  async listCharities(options?: { category?: string; activeOnly?: boolean }) {
    const where: Prisma.CharityWhereInput = {};

    if (options?.category) {
      where.category = options.category;
    }
    if (options?.activeOnly !== false) {
      where.isActive = true;
    }

    return this.prisma.charity.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            campgroundCharities: true,
            donations: true,
          },
        },
      },
    });
  }

  async getCharity(id: string) {
    const charity = await this.prisma.charity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campgroundCharities: true,
            donations: true,
          },
        },
      },
    });

    if (!charity) {
      throw new NotFoundException("Charity not found");
    }

    return charity;
  }

  async createCharity(data: CreateCharityDto) {
    return this.prisma.charity.create({
      data: {
        name: data.name,
        description: data.description,
        logoUrl: data.logoUrl,
        taxId: data.taxId,
        website: data.website,
        category: data.category,
      },
    });
  }

  async updateCharity(id: string, data: UpdateCharityDto) {
    await this.getCharity(id); // Ensure exists

    return this.prisma.charity.update({
      where: { id },
      data,
    });
  }

  async deleteCharity(id: string) {
    await this.getCharity(id); // Ensure exists

    // Soft delete - just deactivate
    return this.prisma.charity.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCharityCategories() {
    const charities = await this.prisma.charity.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    return charities
      .map((c) => c.category)
      .filter(Boolean)
      .sort();
  }

  // ==========================================================================
  // CAMPGROUND CHARITY SETTINGS
  // ==========================================================================

  async getCampgroundCharity(campgroundId: string) {
    return this.prisma.campgroundCharity.findUnique({
      where: { campgroundId },
      include: {
        charity: true,
      },
    });
  }

  async setCampgroundCharity(campgroundId: string, data: SetCampgroundCharityDto) {
    // Verify charity exists
    await this.getCharity(data.charityId);

    return this.prisma.campgroundCharity.upsert({
      where: { campgroundId },
      create: {
        campgroundId,
        charityId: data.charityId,
        isEnabled: data.isEnabled ?? true,
        customMessage: data.customMessage,
        roundUpType: data.roundUpType ?? "nearest_dollar",
        roundUpOptions: data.roundUpOptions as Prisma.InputJsonValue,
        defaultOptIn: data.defaultOptIn ?? false,
      },
      update: {
        charityId: data.charityId,
        isEnabled: data.isEnabled,
        customMessage: data.customMessage,
        roundUpType: data.roundUpType,
        roundUpOptions: data.roundUpOptions as Prisma.InputJsonValue,
        defaultOptIn: data.defaultOptIn,
      },
      include: {
        charity: true,
      },
    });
  }

  async disableCampgroundCharity(campgroundId: string) {
    const settings = await this.getCampgroundCharity(campgroundId);
    if (!settings) return null;

    return this.prisma.campgroundCharity.update({
      where: { campgroundId },
      data: { isEnabled: false },
    });
  }

  // ==========================================================================
  // DONATIONS
  // ==========================================================================

  async createDonation(data: CreateDonationDto) {
    return this.prisma.charityDonation.create({
      data: {
        reservationId: data.reservationId,
        charityId: data.charityId,
        campgroundId: data.campgroundId,
        guestId: data.guestId,
        amountCents: data.amountCents,
        status: "collected",
      },
      include: {
        charity: true,
      },
    });
  }

  async getDonationByReservation(reservationId: string) {
    return this.prisma.charityDonation.findUnique({
      where: { reservationId },
      include: {
        charity: true,
      },
    });
  }

  async refundDonation(reservationId: string) {
    const donation = await this.getDonationByReservation(reservationId);
    if (!donation) return null;

    return this.prisma.charityDonation.update({
      where: { reservationId },
      data: {
        status: "refunded",
        refundedAt: new Date(),
      },
    });
  }

  async listDonations(options: {
    campgroundId?: string;
    charityId?: string;
    status?: DonationStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.CharityDonationWhereInput = {};

    if (options.campgroundId) where.campgroundId = options.campgroundId;
    if (options.charityId) where.charityId = options.charityId;
    if (options.status) where.status = options.status;
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [donations, total] = await Promise.all([
      this.prisma.charityDonation.findMany({
        where,
        include: {
          charity: true,
          reservation: {
            select: {
              id: true,
              arrivalDate: true,
              departureDate: true,
              guest: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options.limit ?? 50,
        skip: options.offset ?? 0,
      }),
      this.prisma.charityDonation.count({ where }),
    ]);

    return { donations, total };
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  async getCharityStats(options: {
    charityId?: string;
    campgroundId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<CharityStats> {
    const where: Prisma.CharityDonationWhereInput = {
      status: { not: "refunded" },
    };

    if (options.charityId) where.charityId = options.charityId;
    if (options.campgroundId) where.campgroundId = options.campgroundId;
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    // Get donation stats
    const donations = await this.prisma.charityDonation.aggregate({
      where,
      _count: true,
      _sum: { amountCents: true },
    });

    // Get unique donors
    const donors = await this.prisma.charityDonation.groupBy({
      by: ["guestId"],
      where: { ...where, guestId: { not: null } },
    });

    // Get by status
    const byStatus = await this.prisma.charityDonation.groupBy({
      by: ["status"],
      where: options.campgroundId ? { campgroundId: options.campgroundId } : {},
      _count: true,
      _sum: { amountCents: true },
    });

    // Calculate opt-in rate (requires reservation count)
    let optInRate = 0;
    if (options.campgroundId) {
      const reservationCount = await this.prisma.reservation.count({
        where: {
          campgroundId: options.campgroundId,
          status: { in: ["confirmed", "checked_in", "checked_out"] },
          createdAt: where.createdAt,
        },
      });
      if (reservationCount > 0) {
        optInRate = (donations._count / reservationCount) * 100;
      }
    }

    return {
      totalDonations: donations._count,
      totalAmountCents: donations._sum.amountCents ?? 0,
      donorCount: donors.length,
      optInRate: Math.round(optInRate * 10) / 10,
      averageDonationCents:
        donations._count > 0
          ? Math.round((donations._sum.amountCents ?? 0) / donations._count)
          : 0,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        amountCents: s._sum.amountCents ?? 0,
      })),
    };
  }

  async getCampgroundDonationStats(campgroundId: string, startDate?: Date, endDate?: Date) {
    return this.getCharityStats({ campgroundId, startDate, endDate });
  }

  async getPlatformDonationStats(startDate?: Date, endDate?: Date) {
    const stats = await this.getCharityStats({ startDate, endDate });

    // Also get per-charity breakdown
    const byCharity = await this.prisma.charityDonation.groupBy({
      by: ["charityId"],
      where: {
        status: { not: "refunded" },
        createdAt: startDate || endDate ? {
          gte: startDate,
          lte: endDate,
        } : undefined,
      },
      _count: true,
      _sum: { amountCents: true },
    });

    const charities = await this.prisma.charity.findMany({
      where: { id: { in: byCharity.map((c) => c.charityId) } },
      select: { id: true, name: true, logoUrl: true },
    });

    const charityMap = new Map(charities.map((c) => [c.id, c]));

    return {
      ...stats,
      byCharity: byCharity.map((c) => ({
        charity: charityMap.get(c.charityId),
        count: c._count,
        amountCents: c._sum.amountCents ?? 0,
      })),
    };
  }

  // ==========================================================================
  // PAYOUTS
  // ==========================================================================

  async createPayout(charityId: string, createdBy?: string) {
    // Get all collected donations for this charity
    const donations = await this.prisma.charityDonation.findMany({
      where: {
        charityId,
        status: "collected",
      },
    });

    if (donations.length === 0) {
      throw new Error("No donations available for payout");
    }

    const totalAmountCents = donations.reduce((sum, d) => sum + d.amountCents, 0);

    // Create payout and update donations in a transaction
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.charityPayout.create({
        data: {
          charityId,
          amountCents: totalAmountCents,
          status: "pending",
          createdBy,
        },
        include: {
          charity: true,
        },
      });

      // Mark donations as pending_payout
      await tx.charityDonation.updateMany({
        where: {
          id: { in: donations.map((d) => d.id) },
        },
        data: {
          status: "pending_payout",
          payoutId: payout.id,
        },
      });

      return payout;
    });
  }

  async completePayout(payoutId: string, reference?: string, notes?: string) {
    const payout = await this.prisma.charityPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException("Payout not found");
    }

    return this.prisma.$transaction(async (tx) => {
      // Update payout
      const updatedPayout = await tx.charityPayout.update({
        where: { id: payoutId },
        data: {
          status: "completed",
          payoutDate: new Date(),
          reference,
          notes,
        },
        include: {
          charity: true,
        },
      });

      // Mark donations as paid_out
      await tx.charityDonation.updateMany({
        where: { payoutId },
        data: { status: "paid_out" },
      });

      return updatedPayout;
    });
  }

  async listPayouts(options?: {
    charityId?: string;
    status?: CharityPayoutStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.CharityPayoutWhereInput = {};

    if (options?.charityId) where.charityId = options.charityId;
    if (options?.status) where.status = options.status;

    const [payouts, total] = await Promise.all([
      this.prisma.charityPayout.findMany({
        where,
        include: {
          charity: true,
          _count: { select: { donations: true } },
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.charityPayout.count({ where }),
    ]);

    return { payouts, total };
  }

  // ==========================================================================
  // ROUND-UP CALCULATION
  // ==========================================================================

  calculateRoundUp(
    totalCents: number,
    roundUpType: string,
    roundUpOptions?: { values: number[] }
  ): { roundUpAmount: number; newTotal: number } {
    let roundUpAmount = 0;

    switch (roundUpType) {
      case "nearest_dollar":
        // Round up to nearest $1.00
        roundUpAmount = (100 - (totalCents % 100)) % 100;
        break;

      case "nearest_5":
        // Round up to nearest $5.00
        roundUpAmount = (500 - (totalCents % 500)) % 500;
        break;

      case "fixed":
        // Use first fixed value (default $1)
        const values = roundUpOptions?.values ?? [100];
        roundUpAmount = values[0];
        break;

      default:
        roundUpAmount = (100 - (totalCents % 100)) % 100;
    }

    // If round-up would be 0, use $1
    if (roundUpAmount === 0) {
      roundUpAmount = 100;
    }

    return {
      roundUpAmount,
      newTotal: totalCents + roundUpAmount,
    };
  }
}
