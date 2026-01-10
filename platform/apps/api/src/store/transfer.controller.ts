import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { TransferService, CreateTransferDto } from "./transfer.service";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ScopeGuard } from "../permissions/scope.guard";
import type { AuthUser } from "../auth/auth.types";
import { InventoryTransferStatus } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Controller()
export class TransferController {
    constructor(private readonly transferService: TransferService) {}

    private requireCampgroundId(req: Request, fallback?: string): string {
        const headerValue = req.headers["x-campground-id"];
        const headerCampgroundId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
        const campgroundId = fallback ?? req.campgroundId ?? headerCampgroundId ?? undefined;
        if (!campgroundId) {
            throw new BadRequestException("campgroundId is required");
        }
        return campgroundId;
    }

    private assertCampgroundAccess(campgroundId: string, user: AuthUser | null | undefined): void {
        const isPlatformStaff =
            user?.platformRole === "platform_admin" ||
            user?.platformRole === "platform_superadmin" ||
            user?.platformRole === "support_agent";
        if (isPlatformStaff) {
            return;
        }

        const userCampgroundIds = user?.memberships?.map((membership) => membership.campgroundId) ?? [];
        if (!userCampgroundIds.includes(campgroundId)) {
            throw new BadRequestException("You do not have access to this campground");
        }
    }

    @Get("campgrounds/:campgroundId/store/transfers")
    listTransfers(
        @Param("campgroundId") campgroundId: string,
        @Query("status") status?: string,
        @Query("fromLocationId") fromLocationId?: string,
        @Query("toLocationId") toLocationId?: string,
        @Req() req: Request
    ) {
        this.assertCampgroundAccess(campgroundId, req.user);
        const statusValues: Set<string> = new Set(Object.values(InventoryTransferStatus));
        const isInventoryTransferStatus = (value: string): value is InventoryTransferStatus =>
            statusValues.has(value);
        const statusFilter = status && isInventoryTransferStatus(status) ? status : undefined;
        return this.transferService.listTransfers(campgroundId, {
            status: statusFilter,
            fromLocationId,
            toLocationId,
        });
    }

    @Get("store/transfers/:id")
    getTransfer(
        @Param("id") id: string,
        @Query("campgroundId") campgroundId: string | undefined,
        @Req() req: Request
    ) {
        const requiredCampgroundId = this.requireCampgroundId(req, campgroundId);
        this.assertCampgroundAccess(requiredCampgroundId, req.user);
        return this.transferService.getTransfer(requiredCampgroundId, id);
    }

    @Post("campgrounds/:campgroundId/store/transfers")
    createTransfer(
        @Param("campgroundId") campgroundId: string,
        @Body() body: Omit<CreateTransferDto, "campgroundId">,
        @Req() req: Request
    ) {
        const userId = req.user?.id || req.user?.userId;
        this.assertCampgroundAccess(campgroundId, req.user);
        return this.transferService.createTransfer({ campgroundId, ...body }, userId);
    }

    @Patch("store/transfers/:id/approve")
    approveTransfer(
        @Param("id") id: string,
        @Query("campgroundId") campgroundId: string | undefined,
        @Req() req: Request
    ) {
        const userId = req.user?.id || req.user?.userId;
        const requiredCampgroundId = this.requireCampgroundId(req, campgroundId);
        this.assertCampgroundAccess(requiredCampgroundId, req.user);
        return this.transferService.approveTransfer(requiredCampgroundId, id, userId);
    }

    @Patch("store/transfers/:id/complete")
    completeTransfer(
        @Param("id") id: string,
        @Query("campgroundId") campgroundId: string | undefined,
        @Req() req: Request
    ) {
        const userId = req.user?.id || req.user?.userId;
        const requiredCampgroundId = this.requireCampgroundId(req, campgroundId);
        this.assertCampgroundAccess(requiredCampgroundId, req.user);
        return this.transferService.completeTransfer(requiredCampgroundId, id, userId);
    }

    @Patch("store/transfers/:id/cancel")
    cancelTransfer(
        @Param("id") id: string,
        @Query("campgroundId") campgroundId: string | undefined,
        @Req() req: Request
    ) {
        const userId = req.user?.id || req.user?.userId;
        const requiredCampgroundId = this.requireCampgroundId(req, campgroundId);
        this.assertCampgroundAccess(requiredCampgroundId, req.user);
        return this.transferService.cancelTransfer(requiredCampgroundId, id, userId);
    }
}
