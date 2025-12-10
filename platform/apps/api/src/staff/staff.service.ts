import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationType } from '@prisma/client';

interface CreateShiftDto {
  campgroundId: string;
  userId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
  createdBy?: string;
}

interface CreateAvailabilityDto {
  campgroundId: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(StaffService.name);

  // ---- Shifts ----

  async createShift(dto: CreateShiftDto) {
    return this.prisma.staffShift.create({
      data: {
        campgroundId: dto.campgroundId,
        userId: dto.userId,
        shiftDate: new Date(dto.shiftDate),
        startTime: new Date(`${dto.shiftDate}T${dto.startTime}`),
        endTime: new Date(`${dto.shiftDate}T${dto.endTime}`),
        role: dto.role,
        notes: dto.notes,
        createdBy: dto.createdBy,
      },
    });
  }

  async listShifts(
    campgroundId: string,
    startDate: Date,
    endDate: Date,
    userId?: string
  ) {
    return this.prisma.staffShift.findMany({
      where: {
        campgroundId,
        shiftDate: { gte: startDate, lte: endDate },
        ...(userId ? { userId } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateShift(id: string, dto: Partial<CreateShiftDto>) {
    const existing = await this.prisma.staffShift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shift not found');

    return this.prisma.staffShift.update({
      where: { id },
      data: {
        startTime: dto.startTime
          ? new Date(`${dto.shiftDate || existing.shiftDate.toISOString().split('T')[0]}T${dto.startTime}`)
          : undefined,
        endTime: dto.endTime
          ? new Date(`${dto.shiftDate || existing.shiftDate.toISOString().split('T')[0]}T${dto.endTime}`)
          : undefined,
        role: dto.role,
        notes: dto.notes,
      },
    });
  }

  async deleteShift(id: string) {
    return this.prisma.staffShift.delete({ where: { id } });
  }

  async clockIn(shiftId: string) {
    return this.prisma.staffShift.update({
      where: { id: shiftId },
      data: { clockedInAt: new Date() },
    });
  }

  async clockOut(shiftId: string) {
    return this.prisma.staffShift.update({
      where: { id: shiftId },
      data: { clockedOutAt: new Date() },
    });
  }

  // ---- Availability ----

  async setAvailability(dto: CreateAvailabilityDto) {
    return this.prisma.staffAvailability.upsert({
      where: {
        campgroundId_userId_dayOfWeek: {
          campgroundId: dto.campgroundId,
          userId: dto.userId,
          dayOfWeek: dto.dayOfWeek,
        },
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        isAvailable: dto.isAvailable ?? true,
      },
      create: {
        campgroundId: dto.campgroundId,
        userId: dto.userId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async getAvailability(campgroundId: string, userId?: string) {
    return this.prisma.staffAvailability.findMany({
      where: {
        campgroundId,
        ...(userId ? { userId } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ userId: 'asc' }, { dayOfWeek: 'asc' }],
    });
  }

  // ---- Push Notifications ----

  async sendNotification(
    campgroundId: string,
    userId: string | null,
    type: PushNotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    const pushEnabled = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';
    const fcmKey = process.env.FCM_SERVER_KEY;

    const notification = await this.prisma.pushNotification.create({
      data: {
        campgroundId,
        userId,
        type,
        title,
        body,
        data,
        sentAt: new Date(),
      },
    });

    // Delivery gating: only attempt if explicitly enabled and key present
    if (pushEnabled && fcmKey && userId) {
      try {
        // Fetch push subscriptions for the user
        const subs = await this.prisma.pushSubscription.findMany({
          where: { userId },
          select: { endpoint: true, keys: true }
        });

        // Minimal FCM-like payload; replace with real SDK as needed
        for (const sub of subs) {
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `key=${fcmKey}`
            },
            body: JSON.stringify({
              to: sub.endpoint,
              notification: { title, body },
              data
            })
          }).catch(() => {
            this.logger?.warn?.(`[Push] Failed to send to ${sub.endpoint}`);
          });
        }
      } catch (err) {
        this.logger?.error?.('[Push] Delivery failed', err as any);
      }
    } else {
      // Environment or opt-in not present; log only
      console.log(`[Push] (noop) ${type}: ${title} to user ${userId ?? 'n/a'}`);
    }

    return notification;
  }

  async getNotifications(userId: string, limit = 50, unreadOnly = false) {
    return this.prisma.pushNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markNotificationRead(id: string) {
    return this.prisma.pushNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.pushNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // ---- Performance Tracking ----

  async recordPerformance(
    campgroundId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    metrics: {
      tasksCompleted?: number;
      tasksSlaOnTime?: number;
      checkinsHandled?: number;
      avgTaskMinutes?: number;
      hoursWorked?: number;
      notes?: string;
    }
  ) {
    return this.prisma.staffPerformance.upsert({
      where: {
        campgroundId_userId_periodStart_periodEnd: {
          campgroundId,
          userId,
          periodStart,
          periodEnd,
        },
      },
      update: metrics,
      create: {
        campgroundId,
        userId,
        periodStart,
        periodEnd,
        ...metrics,
      },
    });
  }

  async getPerformance(campgroundId: string, userId?: string, startDate?: Date, endDate?: Date) {
    return this.prisma.staffPerformance.findMany({
      where: {
        campgroundId,
        ...(userId ? { userId } : {}),
        ...(startDate ? { periodStart: { gte: startDate } } : {}),
        ...(endDate ? { periodEnd: { lte: endDate } } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  /**
   * Calculate performance metrics for a staff member
   */
  async calculatePerformanceMetrics(campgroundId: string, userId: string, periodStart: Date, periodEnd: Date) {
    // Count completed tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        tenantId: campgroundId,
        assignedToUserId: userId,
        state: 'done',
        updatedAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const tasksCompleted = tasks.length;
    const tasksSlaOnTime = tasks.filter(t => t.slaStatus === 'on_track').length;

    // Get shifts and calculate hours worked
    const shifts = await this.prisma.staffShift.findMany({
      where: {
        campgroundId,
        userId,
        shiftDate: { gte: periodStart, lte: periodEnd },
        clockedInAt: { not: null },
        clockedOutAt: { not: null },
      },
    });

    let hoursWorked = 0;
    for (const shift of shifts) {
      if (shift.clockedInAt && shift.clockedOutAt) {
        hoursWorked += (shift.clockedOutAt.getTime() - shift.clockedInAt.getTime()) / (1000 * 60 * 60);
      }
    }

    return this.recordPerformance(campgroundId, userId, periodStart, periodEnd, {
      tasksCompleted,
      tasksSlaOnTime,
      hoursWorked: Math.round(hoursWorked * 10) / 10,
    });
  }
}

