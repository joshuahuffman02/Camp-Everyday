import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationEventCategory, MaintenancePriority, MaintenanceStatus } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) { }

  async create(data: {
    campgroundId: string;
    siteId?: string;
    title: string;
    description?: string;
    priority?: MaintenancePriority;
    dueDate?: string;
    assignedTo?: string;
    isBlocking?: boolean;
    outOfOrder?: boolean;
    outOfOrderReason?: string;
    outOfOrderUntil?: string;
    checklist?: any;
    photos?: any;
    notes?: string;
    lockId?: string;
  }) {
    const lockId = data.lockId ?? randomUUID();

    return this.prisma.maintenanceTicket.create({
      data: {
        campgroundId: data.campgroundId,
        siteId: data.siteId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedTo: data.assignedTo,
        isBlocking: data.isBlocking,
        outOfOrder: data.outOfOrder ?? false,
        outOfOrderReason: data.outOfOrderReason,
        outOfOrderUntil: data.outOfOrderUntil ? new Date(data.outOfOrderUntil) : undefined,
        checklist: data.checklist,
        photos: data.photos,
        notes: data.notes,
        lockId,
      },
      include: {
        site: true,
        assignee: true,
      },
    });
  }

  async findAll(campgroundId: string, status?: MaintenanceStatus, siteId?: string, outOfOrder?: boolean) {
    return this.prisma.maintenanceTicket.findMany({
      where: {
        campgroundId,
        status,
        siteId,
        outOfOrder: outOfOrder !== undefined ? outOfOrder : undefined,
      },
      include: {
        site: true,
        assignee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        site: true,
        assignee: true,
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    dueDate?: string;
    assignedTo?: string;
    assignedToTeamId?: string;
    isBlocking?: boolean;
    resolvedAt?: string;
    outOfOrder?: boolean;
    outOfOrderReason?: string;
    outOfOrderUntil?: string;
    checklist?: any;
    photos?: any;
    notes?: string;
  }) {
    const existing = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
    });

    if (!existing) throw new Error('Ticket not found');

    // If status is closed, set resolvedAt if not provided
    let resolvedAt = data.resolvedAt ? new Date(data.resolvedAt) : undefined;
    if (data.status === 'closed' && !resolvedAt) {
      resolvedAt = new Date();
    }

    // Handle reopening
    let reopenedAt: Date | undefined;
    const isReopening = existing.status === 'closed' && data.status && data.status !== 'closed';
    if (isReopening) {
      reopenedAt = new Date();
    }

    // If resolving/closing, clear out-of-order unless explicitly kept
    let outOfOrder = data.outOfOrder;
    if (data.status === 'closed' && outOfOrder === undefined) {
      outOfOrder = false;
    }

    const updatePayload = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assignedTo: data.assignedTo,
      assignedToTeamId: data.assignedToTeamId,
      isBlocking: data.isBlocking,
      resolvedAt,
      reopenedAt,
      outOfOrder,
      outOfOrderReason: data.outOfOrderReason,
      outOfOrderUntil: data.outOfOrderUntil ? new Date(data.outOfOrderUntil) : undefined,
      checklist: data.checklist,
      photos: data.photos,
      notes: data.notes,
    };

    const updated = await this.prisma.maintenanceTicket.update({
      where: { id },
      data: updatePayload,
      include: {
        site: true,
        assignee: true,
      },
    });

    const isClosing = existing && data.status === 'closed' && existing.status !== 'closed';
    const targetUserId = updatePayload.assignedTo ?? existing?.assignedTo;

    if (isClosing && targetUserId) {
      await this.gamification.recordEvent({
        campgroundId: updated.campgroundId,
        userId: targetUserId,
        membershipId: undefined,
        category: GamificationEventCategory.maintenance,
        reason: `Maintenance closed: ${updated.title}`,
        sourceType: "maintenance_ticket",
        sourceId: updated.id,
        eventKey: `maintenance:${updated.id}:closed`,
      });
    }

    // TODO: Emit maintenance state/out_of_order change communication

    return updated;
  }

  async remove(id: string) {
    return this.prisma.maintenanceTicket.delete({
      where: { id },
    });
  }
}
