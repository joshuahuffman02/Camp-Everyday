import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInStatus, CheckOutStatus } from '@prisma/client';

export type CheckinResult = {
  status: 'completed' | 'failed';
  reason?: string;
  selfCheckInAt?: Date;
};

export type CheckoutResult = {
  status: 'completed' | 'failed';
  reason?: string;
  selfCheckOutAt?: Date;
};

@Injectable()
export class SelfCheckinService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate prerequisites for self check-in
   */
  async validateCheckinPrerequisites(reservationId: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { site: true },
    });

    if (!reservation) {
      return { valid: false, reason: 'reservation_not_found' };
    }

    // Check payment if required
    if (reservation.paymentRequired && reservation.paymentStatus !== 'paid') {
      return { valid: false, reason: 'payment_required' };
    }

    // Check ID verification if required
    if (reservation.idVerificationRequired) {
      // TODO: Check if ID verification completed via external service
      // For now, assume it's handled elsewhere or skip
    }

    // Check waiver if required
    if (reservation.waiverRequired) {
      // TODO: Check if waiver signed
      // For now, assume it's handled elsewhere or skip
    }

    // Check site ready
    if (!reservation.siteReady) {
      return { valid: false, reason: 'site_not_ready' };
    }

    // Check if site is out of order (via maintenance)
    const outOfOrderTicket = await this.prisma.maintenanceTicket.findFirst({
      where: {
        siteId: reservation.siteId,
        outOfOrder: true,
        status: { notIn: ['closed'] },
      },
    });

    if (outOfOrderTicket) {
      return { valid: false, reason: 'site_out_of_order' };
    }

    return { valid: true };
  }

  /**
   * Perform self check-in
   */
  async selfCheckin(
    reservationId: string,
    options?: { lateArrival?: boolean; override?: boolean },
  ): Promise<CheckinResult> {
    // Validate prerequisites unless override
    if (!options?.override) {
      const validation = await this.validateCheckinPrerequisites(reservationId);
      if (!validation.valid) {
        const reservation = await this.prisma.reservation.update({
          where: { id: reservationId },
          data: { checkInStatus: 'failed' },
          include: { campground: true, guest: true },
        });

        // Emit check-in failed communication
        try {
          await this.prisma.communication.create({
            data: {
              campgroundId: reservation.campgroundId,
              guestId: reservation.guestId,
              reservationId: reservation.id,
              type: 'email',
              subject: `Check-in issue at ${reservation.campground.name}`,
              body: `We couldn't complete your check-in. Reason: ${validation.reason?.replace('_', ' ')}. Please contact the front desk.`,
              status: 'queued',
              direction: 'outbound',
            },
          });
        } catch (err) {
          console.error('Failed to create checkin-failed communication:', err);
        }

        return { status: 'failed', reason: validation.reason };
      }
    }

    const now = new Date();
    const reservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkInStatus: 'completed',
        selfCheckInAt: now,
        lateArrivalFlag: options?.lateArrival ?? false,
        status: 'checked_in',
      },
      include: { campground: true, guest: true, site: true },
    });

    // Emit check-in success communication
    try {
      await this.prisma.communication.create({
        data: {
          campgroundId: reservation.campgroundId,
          guestId: reservation.guestId,
          reservationId: reservation.id,
          type: 'email',
          subject: `Welcome to ${reservation.campground.name}!`,
          body: `You're all checked in to site ${reservation.site.siteNumber}. Enjoy your stay!`,
          status: 'queued',
          direction: 'outbound',
        },
      });
    } catch (err) {
      console.error('Failed to create checkin-success communication:', err);
    }

    return { status: 'completed', selfCheckInAt: now };
  }

  /**
   * Perform self checkout
   */
  async selfCheckout(
    reservationId: string,
    options?: {
      damageNotes?: string;
      damagePhotos?: string[];
      override?: boolean;
    },
  ): Promise<CheckoutResult> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return { status: 'failed', reason: 'reservation_not_found' };
    }

    // Check for pending balance
    if (reservation.balanceAmount > 0 && !options?.override) {
      // Attempt to capture remaining balance
      // TODO: Integrate with payments service
      // For now, mark as failed if balance remains
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { checkOutStatus: 'failed' },
      });
      return { status: 'failed', reason: 'payment_capture_failed' };
    }

    const now = new Date();
    const updatedReservation = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        checkOutStatus: 'completed',
        selfCheckOutAt: now,
        status: 'checked_out',
      },
      include: { campground: true, guest: true, site: true },
    });

    // Emit checkout success communication with receipt
    try {
      await this.prisma.communication.create({
        data: {
          campgroundId: updatedReservation.campgroundId,
          guestId: updatedReservation.guestId,
          reservationId: updatedReservation.id,
          type: 'email',
          subject: `Thank you for staying at ${updatedReservation.campground.name}!`,
          body: `You've successfully checked out. Final charges: $${(updatedReservation.totalAmount / 100).toFixed(2)}. We hope to see you again!`,
          status: 'queued',
          direction: 'outbound',
        },
      });
    } catch (err) {
      console.error('Failed to create checkout-success communication:', err);
    }

    // If damage reported, create a follow-up task
    if (options?.damageNotes || options?.damagePhotos?.length) {
      try {
        await this.prisma.task.create({
          data: {
            tenantId: updatedReservation.campgroundId,
            type: 'inspection',
            state: 'pending',
            siteId: updatedReservation.siteId,
            reservationId: updatedReservation.id,
            slaStatus: 'on_track',
            notes: `Damage reported: ${options.damageNotes || 'See photos'}`,
            photos: options.damagePhotos ? JSON.stringify(options.damagePhotos) : undefined,
            source: 'auto_turnover',
            createdBy: 'system',
          },
        });
      } catch (err) {
        console.error('Failed to create damage inspection task:', err);
      }
    }

    return { status: 'completed', selfCheckOutAt: now };
  }

  /**
   * Get check-in/out status for a reservation
   */
  async getStatus(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        checkInStatus: true,
        checkOutStatus: true,
        siteReady: true,
        siteReadyAt: true,
        selfCheckInAt: true,
        selfCheckOutAt: true,
        idVerificationRequired: true,
        waiverRequired: true,
        paymentRequired: true,
        lateArrivalFlag: true,
        paymentStatus: true,
        balanceAmount: true,
      },
    });

    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }

    return reservation;
  }
}

