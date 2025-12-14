import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CreateTicketDto, UpdateTicketDto } from "./dto";

type TicketData = CreateTicketDto & {
    id?: string;
    createdAt?: string;
    completedAt?: string;
    status?: string;
    agentNotes?: string;
    votes?: number;
    upvoters?: any[];
};

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    async findAll() {
        return this.prisma.ticket.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    async create(dto: CreateTicketDto) {
        return this.prisma.ticket.create({
            data: {
                title: dto.title?.trim() || "Untitled ticket",
                notes: dto.notes?.trim() || null,
                category: (dto.category as any) || "issue",
                area: dto.area || null,
                url: dto.url || null,
                path: dto.path || null,
                pageTitle: dto.pageTitle || null,
                selection: dto.selection || null,
                submitter: dto.submitter || null,
                client: dto.client || null,
                extra: dto.extra || null,
                status: "open",
                votes: 0,
                upvoters: [],
            },
        });
    }

    async update(id: string, dto: UpdateTicketDto) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            return null;
        }

        // Handle upvote action
        if (dto.action === "upvote") {
            const actorKey = dto.actor?.id || dto.actor?.email;
            const existingUpvoters = (ticket.upvoters as any[]) || [];
            const alreadyUpvoted = actorKey
                ? existingUpvoters.some(
                    (u) =>
                        (u.id && u.id === actorKey) || (u.email && u.email === actorKey)
                )
                : false;

            if (!alreadyUpvoted) {
                return this.prisma.ticket.update({
                    where: { id },
                    data: {
                        votes: ticket.votes + 1,
                        upvoters: [
                            ...existingUpvoters,
                            {
                                id: dto.actor?.id ?? null,
                                name: dto.actor?.name ?? null,
                                email: dto.actor?.email ?? null,
                            },
                        ],
                    },
                });
            }
            return ticket;
        }

        // Handle status/notes update
        const updateData: any = {};
        const wasResolved = ticket.status === "resolved" || ticket.status === "closed";

        if (dto.status) {
            updateData.status = dto.status;
            if (dto.status === "resolved" || dto.status === "closed") {
                updateData.completedAt = new Date();
            }
        }

        if (typeof dto.agentNotes === "string") {
            updateData.agentNotes = dto.agentNotes.trim() || null;
        }

        const updated = await this.prisma.ticket.update({
            where: { id },
            data: updateData,
        });

        // Send email notification when ticket is resolved/closed
        const isNowResolved = updated.status === "resolved" || updated.status === "closed";
        if (isNowResolved && !wasResolved) {
            const submitter = ticket.submitter as any;
            const submitterEmail = submitter?.email;

            if (submitterEmail) {
                try {
                    await this.emailService.sendTicketResolved({
                        to: submitterEmail,
                        ticketId: ticket.id,
                        ticketTitle: ticket.title,
                        resolution: dto.agentNotes || "Your ticket has been resolved. Thank you for your feedback!",
                        agentNotes: updated.agentNotes || undefined,
                    });
                    this.logger.log(`Sent resolution email for ticket ${id} to ${submitterEmail}`);
                } catch (err) {
                    this.logger.warn(`Failed to send resolution email for ticket ${id}: ${err}`);
                }
            }
        }

        return updated;
    }

    // Migration helper: bulk insert tickets from JSON
    async bulkCreate(tickets: TicketData[]) {
        const results = [];
        for (const ticket of tickets) {
            try {
                // Map old status values to new TicketState enum
                let mappedStatus = ticket.status || "open";
                if (mappedStatus === "completed") {
                    mappedStatus = "resolved"; // Map old 'completed' to new 'resolved'
                }

                const created = await this.prisma.ticket.create({
                    data: {
                        id: ticket.id || undefined,
                        title: ticket.title?.trim() || "Untitled ticket",
                        notes: ticket.notes?.trim() || null,
                        category: (ticket.category as any) || "issue",
                        area: ticket.area || null,
                        url: ticket.url || null,
                        path: ticket.path || null,
                        pageTitle: ticket.pageTitle || null,
                        selection: ticket.selection || null,
                        submitter: ticket.submitter || null,
                        client: ticket.client || null,
                        extra: ticket.extra || null,
                        status: mappedStatus as any,
                        agentNotes: ticket.agentNotes?.trim() || null,
                        votes: ticket.votes || 0,
                        upvoters: ticket.upvoters || [],
                        createdAt: ticket.createdAt ? new Date(ticket.createdAt) : undefined,
                        completedAt: ticket.completedAt ? new Date(ticket.completedAt) : null,
                    },
                });
                results.push({ ok: true, id: created.id });
            } catch (err) {
                this.logger.warn(`Failed to import ticket ${ticket.id}: ${err}`);
                results.push({ ok: false, id: ticket.id, error: String(err) });
            }
        }
        return results;
    }
}
