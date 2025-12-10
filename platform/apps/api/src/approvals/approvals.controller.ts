import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApprovalsService } from "./approvals.service";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list() {
    return this.approvals.list();
  }

  @Get("policies")
  policies() {
    return this.approvals.policiesList();
  }

  @Post()
  create(
    @Body()
    body: {
      type: "refund" | "payout" | "config_change";
      amount: number;
      currency: string;
      reason: string;
      requester: string;
      metadata?: Record<string, any>;
    }
  ) {
    return this.approvals.create(body);
  }

  @Post(":id/approve")
  approve(@Param("id") id: string, @Body() body: { approver: string }) {
    return this.approvals.approve(id, body.approver);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Body() body: { approver: string; reason?: string }) {
    return this.approvals.reject(id, body.approver, body.reason);
  }
}

