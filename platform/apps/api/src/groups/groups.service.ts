import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    name?: string;
    sharedPayment?: boolean;
    sharedComm?: boolean;
    reservationIds?: string[];
    primaryReservationId?: string;
  }) {
    const group = await this.prisma.group.create({
      data: {
        tenantId: data.tenantId,
        sharedPayment: data.sharedPayment ?? false,
        sharedComm: data.sharedComm ?? false,
        primaryReservationId: data.primaryReservationId,
      },
    });

    // Link reservations to group
    if (data.reservationIds?.length) {
      await this.prisma.reservation.updateMany({
        where: { id: { in: data.reservationIds } },
        data: {
          groupId: group.id,
          groupRole: 'member',
        },
      });

      // Set primary role
      if (data.primaryReservationId) {
        await this.prisma.reservation.update({
          where: { id: data.primaryReservationId },
          data: { groupRole: 'primary' },
        });
      }
    }

    return this.findOne(group.id);
  }

  async findAll(tenantId: string) {
    const groups = await this.prisma.group.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with reservation counts
    const enriched = await Promise.all(
      groups.map(async (group) => {
        const count = await this.prisma.reservation.count({
          where: { groupId: group.id },
        });
        return { ...group, reservationCount: count };
      }),
    );

    return enriched;
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) return null;

    // Get linked reservations
    const reservations = await this.prisma.reservation.findMany({
      where: { groupId: id },
      select: {
        id: true,
        groupRole: true,
        arrivalDate: true,
        departureDate: true,
        status: true,
        guestId: true,
        siteId: true,
      },
    });

    // Fetch guest and site info separately
    const guestIds = reservations.map((r) => r.guestId);
    const siteIds = reservations.map((r) => r.siteId);

    const guests = await this.prisma.guest.findMany({
      where: { id: { in: guestIds } },
      select: { id: true, primaryFirstName: true, primaryLastName: true, email: true },
    });

    const sites = await this.prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, name: true, siteNumber: true },
    });

    const guestMap = new Map(guests.map((g) => [g.id, g]));
    const siteMap = new Map(sites.map((s) => [s.id, s]));

    const enrichedReservations = reservations.map((r) => ({
      ...r,
      guest: guestMap.get(r.guestId),
      site: siteMap.get(r.siteId),
    }));

    return { ...group, reservations: enrichedReservations };
  }

  async update(
    id: string,
    data: {
      sharedPayment?: boolean;
      sharedComm?: boolean;
      addReservationIds?: string[];
      removeReservationIds?: string[];
    },
  ) {
    // Update group settings
    await this.prisma.group.update({
      where: { id },
      data: {
        sharedPayment: data.sharedPayment,
        sharedComm: data.sharedComm,
      },
    });

    // Add reservations
    if (data.addReservationIds?.length) {
      await this.prisma.reservation.updateMany({
        where: { id: { in: data.addReservationIds } },
        data: {
          groupId: id,
          groupRole: 'member',
        },
      });
    }

    // Remove reservations
    if (data.removeReservationIds?.length) {
      await this.prisma.reservation.updateMany({
        where: { id: { in: data.removeReservationIds } },
        data: {
          groupId: null,
          groupRole: null,
        },
      });
    }

    // TODO: Emit group change communication if sharedComm

    return this.findOne(id);
  }

  async remove(id: string) {
    // Unlink all reservations first
    await this.prisma.reservation.updateMany({
      where: { groupId: id },
      data: { groupId: null, groupRole: null },
    });

    return this.prisma.group.delete({ where: { id } });
  }
}

