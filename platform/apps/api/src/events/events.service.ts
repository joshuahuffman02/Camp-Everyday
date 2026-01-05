import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventSchema } from '@keepr/shared';
import { z } from 'zod';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(data: z.infer<typeof CreateEventSchema> & {
        parentEventId?: string;
        recurrenceDays?: number[];
        recurrenceEndDate?: string;
    }) {
        return this.prisma.event.create({
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
                recurrenceDays: data.recurrenceDays ?? [],
            },
        });
    }

    async findAll(campgroundId: string, start?: string, end?: string) {
        const where: any = { campgroundId };

        if (start && end) {
            where.startDate = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        return this.prisma.event.findMany({
            where,
            include: {
                children: {
                    where: { isCancelled: false },
                    orderBy: { startDate: 'asc' }
                }
            },
            orderBy: { startDate: 'asc' },
        });
    }

    // Get all events for a holiday/themed weekend
    async findByParent(parentEventId: string) {
        return this.prisma.event.findMany({
            where: { parentEventId },
            orderBy: { startDate: 'asc' },
        });
    }

    // Get public events with expanded recurring instances
    async findPublic(campgroundId: string, start: Date, end: Date) {
        const events = await this.prisma.event.findMany({
            where: {
                campgroundId,
                isPublished: true,
                isCancelled: false,
                OR: [
                    // Non-recurring events in range
                    {
                        isRecurring: false,
                        startDate: { gte: start, lte: end }
                    },
                    // Recurring events that overlap the range
                    {
                        isRecurring: true,
                        startDate: { lte: end },
                        OR: [
                            { recurrenceEndDate: null },
                            { recurrenceEndDate: { gte: start } }
                        ]
                    }
                ]
            },
            include: {
                children: {
                    where: { isPublished: true, isCancelled: false },
                    orderBy: { startDate: 'asc' }
                }
            },
            orderBy: { startDate: 'asc' }
        });

        // Expand recurring events into individual instances
        const result: any[] = [];
        for (const event of events) {
            if (event.isRecurring && event.recurrenceDays.length > 0) {
                const instances = this.generateRecurringInstances(event, start, end);
                result.push(...instances);
            } else {
                result.push(event);
            }
        }

        return result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }

    // Generate individual instances for recurring events
    private generateRecurringInstances(event: any, start: Date, end: Date): any[] {
        const instances: any[] = [];
        const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : end;
        const effectiveEnd = recurrenceEnd < end ? recurrenceEnd : end;

        const current = new Date(start);
        while (current <= effectiveEnd) {
            const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
            if (event.recurrenceDays.includes(dayOfWeek)) {
                instances.push({
                    ...event,
                    id: `${event.id}_${current.toISOString().split('T')[0]}`,
                    originalEventId: event.id,
                    startDate: new Date(current),
                    endDate: event.endDate
                        ? new Date(current.getTime() + (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()))
                        : null,
                    isRecurringInstance: true
                });
            }
            current.setDate(current.getDate() + 1);
        }

        return instances;
    }

    // Helper to format recurrence as human-readable string
    getRecurrenceDescription(recurrenceDays: number[]): string {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        if (recurrenceDays.length === 0) return '';
        if (recurrenceDays.length === 7) return 'Daily';
        if (recurrenceDays.length === 2 && recurrenceDays.includes(0) && recurrenceDays.includes(6)) return 'Weekends';
        if (recurrenceDays.length === 5 && !recurrenceDays.includes(0) && !recurrenceDays.includes(6)) return 'Weekdays';
        if (recurrenceDays.length === 1) return `Every ${dayNames[recurrenceDays[0]]}`;

        return recurrenceDays.map(d => shortDays[d]).join(', ');
    }

    async findOne(id: string) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                children: { orderBy: { startDate: 'asc' } },
                parent: true
            }
        });
        if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
        return event;
    }

    async update(id: string, data: Partial<z.infer<typeof CreateEventSchema>> & {
        parentEventId?: string | null;
        recurrenceDays?: number[];
        recurrenceEndDate?: string | null;
    }) {
        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        if (data.recurrenceEndDate) updateData.recurrenceEndDate = new Date(data.recurrenceEndDate);
        if (data.recurrenceEndDate === null) updateData.recurrenceEndDate = null;

        return this.prisma.event.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        return this.prisma.event.delete({ where: { id } });
    }
}
