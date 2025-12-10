import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InternalConversationsService {
    constructor(private readonly prisma: PrismaService) { }

    async createChannel(name: string, campgroundId: string, participantIds: string[]) {
        return this.prisma.internalConversation.create({
            data: {
                name,
                type: 'channel',
                campgroundId,
                participants: {
                    create: participantIds.map((id) => ({ userId: id })),
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async createDM(campgroundId: string, participantIds: string[]) {
        return this.prisma.internalConversation.create({
            data: {
                type: 'dm',
                campgroundId,
                participants: {
                    create: participantIds.map((id) => ({ userId: id })),
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findAll(userId: string, campgroundId: string) {
        return this.prisma.internalConversation.findMany({
            where: {
                campgroundId,
                participants: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    }
}
