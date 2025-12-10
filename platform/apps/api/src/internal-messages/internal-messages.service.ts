import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InternalMessagesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(content: string, senderId: string, conversationId: string) {
        return this.prisma.internalMessage.create({
            data: {
                content,
                senderId,
                conversationId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findAll(conversationId: string, limit: number = 50) {
        // Get the most recent N messages, then reverse so oldest is first for chat display
        const messages = await this.prisma.internalMessage.findMany({
            where: { conversationId },
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                content: true,
                senderId: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        // Reverse so oldest message is first (for chat UI)
        return messages.reverse();
    }
}
