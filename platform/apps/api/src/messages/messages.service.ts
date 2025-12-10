import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) { }

    async listByReservation(reservationId: string) {
        return this.prisma.message.findMany({
            where: { reservationId },
            orderBy: { createdAt: 'asc' },
            include: {
                guest: {
                    select: {
                        id: true,
                        primaryFirstName: true,
                        primaryLastName: true,
                    },
                },
            },
        });
    }

    async create(reservationId: string, data: CreateMessageDto) {
        // First get the reservation to get campgroundId
        const reservation = await this.prisma.reservation.findUniqueOrThrow({
            where: { id: reservationId },
            select: { campgroundId: true, guestId: true },
        });

        return this.prisma.message.create({
            data: {
                campgroundId: reservation.campgroundId,
                reservationId,
                guestId: data.guestId,
                senderType: data.senderType,
                content: data.content,
            },
            include: {
                guest: {
                    select: {
                        id: true,
                        primaryFirstName: true,
                        primaryLastName: true,
                    },
                },
            },
        });
    }

    async markAsRead(messageId: string) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { readAt: new Date() },
        });
    }

    async markAllAsReadForReservation(reservationId: string, senderType: 'guest' | 'staff') {
        // Mark messages from the opposite sender as read
        const oppositeType = senderType === 'guest' ? 'staff' : 'guest';
        return this.prisma.message.updateMany({
            where: {
                reservationId,
                senderType: oppositeType,
                readAt: null,
            },
            data: { readAt: new Date() },
        });
    }

    async getUnreadCount(campgroundId: string) {
        // Count unread messages from guests (for staff to see)
        const count = await this.prisma.message.count({
            where: {
                campgroundId,
                senderType: 'guest',
                readAt: null,
            },
        });
        return { unreadCount: count };
    }

    async getUnreadCountForReservation(reservationId: string) {
        const count = await this.prisma.message.count({
            where: {
                reservationId,
                senderType: 'guest',
                readAt: null,
            },
        });
        return { unreadCount: count };
    }
}
