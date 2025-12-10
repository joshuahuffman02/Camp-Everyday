import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(campgroundId: string, orgId?: string) {
    const campground = await this.prisma.campground.findFirst({
      where: { id: campgroundId, ...(orgId ? { organizationId: orgId } : {}) },
      select: { id: true, organizationId: true, name: true }
    });
    if (!campground) throw new NotFoundException("Campground not found");

    const now = new Date();
    const [sites, reservations, maintenanceOpen, maintenanceOverdue] = await Promise.all([
      this.prisma.site.count({ where: { campgroundId } }),
      this.prisma.reservation.findMany({
        where: { campgroundId },
        select: { arrivalDate: true, departureDate: true, totalAmount: true, paidAmount: true, status: true }
      }),
      this.prisma.maintenanceTicket.count({
        where: { campgroundId, status: { not: "closed" } }
      }),
      this.prisma.maintenanceTicket.count({
        where: {
          campgroundId,
          status: { not: "closed" },
          dueDate: { lt: now }
        }
      })
    ]);

    // Next 30 days by default
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 30);

    let bookedNights = 0;
    let totalNights = 0;
    let revenueCents = 0;
    let futureReservations = 0;
    let overdueBalancesCents = 0;

    for (const r of reservations) {
      const arrival = new Date(r.arrivalDate);
      const departure = new Date(r.departureDate);
      // future reservation count
      if (arrival >= now) futureReservations += 1;

      const start = arrival > now ? arrival : now;
      const end = departure < windowEnd ? departure : windowEnd;
      const ms = end.getTime() - start.getTime();
      const nights = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
      bookedNights += nights;

      const stayNights = Math.max(
        0,
        Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
      );
      totalNights += stayNights;
      revenueCents += r.totalAmount ?? 0;

      const balance = (r.totalAmount ?? 0) - (r.paidAmount ?? 0);
      if (balance > 0 && arrival < now) {
        overdueBalancesCents += balance;
      }
    }

    const occupancy = sites > 0 ? Math.min(100, Math.round((bookedNights / (sites * 30)) * 100)) : 0;
    const adr = totalNights > 0 ? revenueCents / 100 / totalNights : 0;
    const revpar = sites > 0 ? revenueCents / 100 / (sites * 30) : 0;

    return {
      campground: { id: campground.id, name: campground.name },
      sites,
      futureReservations,
      occupancy,
      adr,
      revpar,
      revenue: revenueCents / 100,
      overdueBalance: overdueBalancesCents / 100,
      maintenanceOpen,
      maintenanceOverdue
    };
  }
}
