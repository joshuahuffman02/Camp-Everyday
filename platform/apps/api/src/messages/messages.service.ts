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

    /**
     * Get all conversations for a campground in a single efficient query.
     * Returns reservations that have messages, with all messages included.
     */
    async getConversations(campgroundId: string) {
        // Get all messages for this campground, grouped by reservation
        const messages = await this.prisma.message.findMany({
            where: { campgroundId },
            orderBy: { createdAt: 'asc' },
            include: {
                guest: {
                    select: {
                        id: true,
                        primaryFirstName: true,
                        primaryLastName: true,
                    },
                },
                reservation: {
                    select: {
                        id: true,
                        status: true,
                        guest: {
                            select: {
                                id: true,
                                primaryFirstName: true,
                                primaryLastName: true,
                            },
                        },
                        site: {
                            select: {
                                id: true,
                                name: true,
                                siteNumber: true,
                            },
                        },
                    },
                },
            },
        });

        // Group messages by reservation
        const conversationsMap = new Map<string, {
            reservationId: string;
            guestName: string;
            siteName: string;
            status: string;
            messages: typeof messages;
            unreadCount: number;
            lastMessage: typeof messages[0] | null;
        }>();

        for (const msg of messages) {
            const resId = msg.reservationId;
            if (!conversationsMap.has(resId)) {
                const res = msg.reservation;
                const guestName = res?.guest
                    ? `${res.guest.primaryFirstName || ''} ${res.guest.primaryLastName || ''}`.trim() || 'Unknown Guest'
                    : 'Unknown Guest';
                const siteName = res?.site?.name || res?.site?.siteNumber || 'Unknown Site';

                conversationsMap.set(resId, {
                    reservationId: resId,
                    guestName,
                    siteName,
                    status: res?.status || 'unknown',
                    messages: [],
                    unreadCount: 0,
                    lastMessage: null,
                });
            }

            const conv = conversationsMap.get(resId)!;
            conv.messages.push(msg);
            conv.lastMessage = msg;

            if (msg.senderType === 'guest' && !msg.readAt) {
                conv.unreadCount++;
            }
        }

        // Convert to array and sort by last message time (most recent first)
        const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });

        return conversations;
    }
}
