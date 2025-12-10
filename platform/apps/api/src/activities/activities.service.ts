import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Activity, ActivitySession, ActivityBooking } from '@prisma/client';

type ActivityWaitlistEntry = {
    id: string;
    guestName: string;
    partySize: number;
    contact?: string;
    addedAt: string;
};

type CapacityRecord = {
    capacity: number;
    booked: number;
    waitlistEnabled: boolean;
    waitlist: ActivityWaitlistEntry[];
    lastUpdated: string;
};

type CapacitySnapshot = {
    activityId: string;
    capacity: number;
    booked: number;
    remaining: number;
    waitlistEnabled: boolean;
    waitlistCount: number;
    overage: boolean;
    overageAmount: number;
    lastUpdated: string;
};

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) { }

    private capacityStore: Record<string, CapacityRecord> = {
        'demo-activity': {
            capacity: 20,
            booked: 18,
            waitlistEnabled: true,
            waitlist: [
                { id: 'wl-1', guestName: 'Jordan Creek', partySize: 2, contact: 'jordan@example.com', addedAt: new Date().toISOString() },
            ],
            lastUpdated: new Date().toISOString(),
        },
    };

    private ensureCapacityRecord(activityId: string): CapacityRecord {
        if (!this.capacityStore[activityId]) {
            this.capacityStore[activityId] = {
                capacity: 16,
                booked: 8,
                waitlistEnabled: true,
                waitlist: [],
                lastUpdated: new Date().toISOString(),
            };
        }
        return this.capacityStore[activityId];
    }

    private toSnapshot(activityId: string, record: CapacityRecord): CapacitySnapshot {
        const remaining = Math.max(record.capacity - record.booked, 0);
        const overageAmount = Math.max(record.booked - record.capacity, 0);
        return {
            activityId,
            capacity: record.capacity,
            booked: record.booked,
            remaining,
            waitlistEnabled: record.waitlistEnabled,
            waitlistCount: record.waitlist.length,
            overage: overageAmount > 0,
            overageAmount,
            lastUpdated: record.lastUpdated,
        };
    }

    async getCapacitySnapshot(activityId: string): Promise<CapacitySnapshot> {
        const record = this.ensureCapacityRecord(activityId);
        return this.toSnapshot(activityId, record);
    }

    async updateCapacitySettings(
        activityId: string,
        payload: { capacity?: number; waitlistEnabled?: boolean; booked?: number },
    ): Promise<CapacitySnapshot> {
        const record = this.ensureCapacityRecord(activityId);
        if (payload.capacity !== undefined) {
            if (payload.capacity < 1) throw new BadRequestException('Capacity must be at least 1');
            record.capacity = payload.capacity;
        }
        if (payload.booked !== undefined) {
            record.booked = Math.max(0, payload.booked);
        }
        if (payload.waitlistEnabled !== undefined) {
            record.waitlistEnabled = payload.waitlistEnabled;
        }
        record.lastUpdated = new Date().toISOString();
        return this.toSnapshot(activityId, record);
    }

    async addWaitlistEntry(
        activityId: string,
        entry: { guestName: string; partySize?: number; contact?: string },
    ): Promise<{ entry: ActivityWaitlistEntry; snapshot: CapacitySnapshot }> {
        const record = this.ensureCapacityRecord(activityId);
        if (!record.waitlistEnabled) {
            throw new BadRequestException('Waitlist is disabled for this activity');
        }
        const newEntry: ActivityWaitlistEntry = {
            id: `wl-${Date.now()}`,
            guestName: entry.guestName,
            partySize: Math.max(1, entry.partySize || 1),
            contact: entry.contact,
            addedAt: new Date().toISOString(),
        };
        record.waitlist.unshift(newEntry);
        record.lastUpdated = new Date().toISOString();
        return { entry: newEntry, snapshot: this.toSnapshot(activityId, record) };
    }

    private trackBookingImpact(activityId: string, quantity: number) {
        const record = this.ensureCapacityRecord(activityId);
        record.booked += quantity;
        record.lastUpdated = new Date().toISOString();
    }

    private trackCancellationImpact(activityId: string, quantity: number) {
        const record = this.ensureCapacityRecord(activityId);
        record.booked = Math.max(0, record.booked - quantity);
        record.lastUpdated = new Date().toISOString();
    }

    // Activities
    async createActivity(campgroundId: string, data: any): Promise<Activity> {
        return this.prisma.activity.create({
            data: {
                ...data,
                campgroundId,
            },
        });
    }

    async findAllActivities(campgroundId: string): Promise<Activity[]> {
        return this.prisma.activity.findMany({
            where: { campgroundId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActivity(id: string): Promise<Activity> {
        const activity = await this.prisma.activity.findUnique({
            where: { id },
            include: { sessions: true },
        });
        if (!activity) throw new NotFoundException('Activity not found');
        return activity;
    }

    async updateActivity(id: string, data: any): Promise<Activity> {
        return this.prisma.activity.update({
            where: { id },
            data,
        });
    }

    async deleteActivity(id: string): Promise<Activity> {
        return this.prisma.activity.delete({
            where: { id },
        });
    }

    // Sessions
    async createSession(activityId: string, data: any): Promise<ActivitySession> {
        const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
        if (!activity) throw new NotFoundException('Activity not found');

        return this.prisma.activitySession.create({
            data: {
                ...data,
                activityId,
                capacity: data.capacity || activity.capacity,
            },
        });
    }

    async findSessions(activityId: string): Promise<ActivitySession[]> {
        return this.prisma.activitySession.findMany({
            where: { activityId },
            orderBy: { startTime: 'asc' },
            include: { bookings: true },
        });
    }

    // Bookings
    async createBooking(sessionId: string, guestId: string, quantity: number, reservationId?: string): Promise<ActivityBooking> {
        const session = await this.prisma.activitySession.findUnique({
            where: { id: sessionId },
            include: { activity: true },
        });
        if (!session) throw new NotFoundException('Session not found');

        if (session.bookedCount + quantity > session.capacity) {
            throw new BadRequestException('Session capacity exceeded');
        }

        const totalAmount = session.activity.price * quantity;

        const [booking, updatedSession] = await this.prisma.$transaction([
            this.prisma.activityBooking.create({
                data: {
                    sessionId,
                    guestId,
                    reservationId,
                    quantity,
                    totalAmount,
                },
            }),
            this.prisma.activitySession.update({
                where: { id: sessionId },
                data: { bookedCount: { increment: quantity } },
            }),
        ]);

        this.trackBookingImpact(session.activityId, quantity);
        return booking;
    }

    async cancelBooking(id: string): Promise<ActivityBooking> {
        const booking = await this.prisma.activityBooking.findUnique({ where: { id } });
        if (!booking) throw new NotFoundException('Booking not found');

        const session = await this.prisma.activitySession.findUnique({ where: { id: booking.sessionId } });
        const [cancelledBooking] = await this.prisma.$transaction([
            this.prisma.activityBooking.update({
                where: { id },
                data: { status: 'cancelled' },
            }),
            this.prisma.activitySession.update({
                where: { id: booking.sessionId },
                data: { bookedCount: { decrement: booking.quantity } },
            }),
        ]);

        if (session) {
            this.trackCancellationImpact(session.activityId, booking.quantity);
        }
        return cancelledBooking;
    }
}
