import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

type ApprovalStatus = "pending" | "pending_second" | "approved" | "rejected";

type ApprovalRequest = {
  id: string;
  type: "refund" | "payout" | "config_change";
  amount: number;
  currency: string;
  status: ApprovalStatus;
  reason: string;
  requester: string;
  approvals: { approver: string; at: string }[];
  requiredApprovals: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  policyId: string;
};

type ApprovalPolicy = {
  id: string;
  name: string;
  appliesTo: ("refund" | "payout" | "config_change")[];
  thresholdCents?: number;
  currency: string;
  approversNeeded: number;
  description: string;
};

@Injectable()
export class ApprovalsService {
  private readonly policies: ApprovalPolicy[] = [
    {
      id: "policy-refund",
      name: "Refunds over $250",
      appliesTo: ["refund"],
      thresholdCents: 25000,
      currency: "USD",
      approversNeeded: 2,
      description: "Dual control for refunds above $250 or cross-currency refunds.",
    },
    {
      id: "policy-payout",
      name: "Payout releases",
      appliesTo: ["payout"],
      approversNeeded: 2,
      currency: "USD",
      description: "Require two approvers for operator payouts.",
    },
    {
      id: "policy-config",
      name: "High-value config",
      appliesTo: ["config_change"],
      approversNeeded: 1,
      currency: "USD",
      description: "Pricing/tax/currency changes above safe threshold.",
    },
  ];

  private readonly requests: ApprovalRequest[] = [
    {
      id: "ap-001",
      type: "refund",
      amount: 27500,
      currency: "USD",
      status: "pending",
      reason: "Refund for early departure (Reservation #R-1042)",
      requester: "Alex Rivera",
      approvals: [],
      requiredApprovals: 2,
      metadata: { reservationId: "R-1042", guest: "Morgan Lee" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyId: "policy-refund",
    },
    {
      id: "ap-002",
      type: "payout",
      amount: 128500,
      currency: "USD",
      status: "pending_second",
      reason: "Weekly operator payout",
      requester: "Finance Bot",
      approvals: [{ approver: "Dana W.", at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }],
      requiredApprovals: 2,
      metadata: { period: "2025-12-01 → 2025-12-07" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyId: "policy-payout",
    },
    {
      id: "ap-003",
      type: "config_change",
      amount: 0,
      currency: "USD",
      status: "pending",
      reason: "Toggle VAT-inclusive pricing for EU parks",
      requester: "Compliance",
      approvals: [],
      requiredApprovals: 1,
      metadata: { portfolioId: "pf-continental", parkIds: ["cg-alpine"] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyId: "policy-config",
    },
  ];

  list() {
    return { requests: this.requests, policies: this.policies };
  }

  create(payload: {
    type: ApprovalRequest["type"];
    amount: number;
    currency: string;
    reason: string;
    requester: string;
    metadata?: Record<string, any>;
  }) {
    const policy = this.resolvePolicy(payload.type, payload.amount, payload.currency);
    const requiredApprovals = policy?.approversNeeded ?? 1;
    const request: ApprovalRequest = {
      id: randomUUID(),
      type: payload.type,
      amount: payload.amount,
      currency: payload.currency,
      status: "pending",
      reason: payload.reason,
      requester: payload.requester,
      approvals: [],
      requiredApprovals,
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyId: policy?.id ?? "policy-manual",
    };
    this.requests.unshift(request);
    return request;
  }

  approve(id: string, approver: string) {
    const request = this.requests.find((r) => r.id === id);
    if (!request) return null;
    const already = request.approvals.some((a) => a.approver === approver);
    if (!already) {
      request.approvals.push({ approver, at: new Date().toISOString() });
    }
    const approvalsCount = request.approvals.length;
    request.status = approvalsCount >= request.requiredApprovals ? "approved" : "pending_second";
    request.updatedAt = new Date().toISOString();
    return request;
  }

  reject(id: string, approver: string, reason?: string) {
    const request = this.requests.find((r) => r.id === id);
    if (!request) return null;
    request.status = "rejected";
    request.updatedAt = new Date().toISOString();
    request.metadata = { ...request.metadata, rejectionReason: reason, rejectedBy: approver };
    return request;
  }

  policiesList() {
    return this.policies;
  }

  private resolvePolicy(type: ApprovalRequest["type"], amount: number, currency: string) {
    return this.policies.find((p) => {
      const matchesType = p.appliesTo.includes(type);
      const matchesCurrency = !p.currency || p.currency === currency;
      const meetsThreshold = p.thresholdCents ? amount * 100 >= p.thresholdCents : true;
      return matchesType && matchesCurrency && meetsThreshold;
    });
  }
}

