import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { AiProviderService } from "./ai-provider.service";
import { AiPrivacyService } from "./ai-privacy.service";
import { AiFeatureGateService } from "./ai-feature-gate.service";
import { AiFeatureType, UserRole } from "@prisma/client";
import { PermissionsService } from "../permissions/permissions.service";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { HoldsService } from "../holds/holds.service";
import { PublicReservationsService } from "../public-reservations/public-reservations.service";

type PartnerMode = "staff" | "admin";

type ActionType =
  | "lookup_availability"
  | "create_hold"
  | "move_reservation"
  | "adjust_rate"
  | "none";

type ImpactArea = "availability" | "pricing" | "policy" | "revenue" | "operations" | "none";

type EvidenceLink = { label: string; url: string };

type ImpactSummary = {
  level: "low" | "medium" | "high";
  summary: string;
  warnings?: string[];
  saferAlternative?: string;
};

type ActionDraft = {
  id: string;
  actionType: ActionType;
  resource: string;
  action: "read" | "write";
  parameters: Record<string, any>;
  status: "draft" | "executed" | "denied";
  requiresConfirmation?: boolean;
  sensitivity?: "low" | "medium" | "high";
  impactArea?: ImpactArea;
  impact?: ImpactSummary;
  evidenceLinks?: EvidenceLink[];
  result?: Record<string, any>;
};

export type AiPartnerResponse = {
  mode: PartnerMode;
  message: string;
  actionDrafts?: ActionDraft[];
  confirmations?: { id: string; prompt: string }[];
  denials?: { reason: string; guidance?: string }[];
  questions?: string[];
  evidenceLinks?: EvidenceLink[];
};

type PartnerChatRequest = {
  campgroundId: string;
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  sessionId?: string;
  user: any;
};

const ACTION_REGISTRY: Record<
  Exclude<ActionType, "none">,
  { resource: string; action: "read" | "write"; impactArea: ImpactArea; sensitivity: "low" | "medium" | "high"; confirmByDefault?: boolean }
> = {
  lookup_availability: {
    resource: "reservations",
    action: "read",
    impactArea: "availability",
    sensitivity: "low"
  },
  create_hold: {
    resource: "holds",
    action: "write",
    impactArea: "availability",
    sensitivity: "medium"
  },
  move_reservation: {
    resource: "reservations",
    action: "write",
    impactArea: "availability",
    sensitivity: "high",
    confirmByDefault: true
  },
  adjust_rate: {
    resource: "pricing",
    action: "write",
    impactArea: "pricing",
    sensitivity: "high",
    confirmByDefault: true
  }
};

@Injectable()
export class AiPartnerService {
  private readonly logger = new Logger(AiPartnerService.name);

  constructor(
    private readonly provider: AiProviderService,
    private readonly privacy: AiPrivacyService,
    private readonly gate: AiFeatureGateService,
    private readonly permissions: PermissionsService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly holds: HoldsService,
    private readonly publicReservations: PublicReservationsService
  ) { }

  async chat(request: PartnerChatRequest): Promise<AiPartnerResponse> {
    const { campgroundId, message, history = [], sessionId, user } = request;

    await this.gate.assertFeatureEnabled(campgroundId, AiFeatureType.reply_assist);

    const campground = await this.prisma.campground.findUnique({
      where: { id: campgroundId },
      select: { id: true, name: true, slug: true, aiAnonymizationLevel: true }
    });

    if (!campground) {
      return {
        mode: "staff",
        message: "Campground not found.",
        denials: [{ reason: "Campground not found." }]
      };
    }

    const { role, mode } = this.resolveUserRole(user, campgroundId);
    const { anonymizedText, tokenMap } = this.privacy.anonymize(message, campground.aiAnonymizationLevel ?? "moderate");
    const { historyText, historyTokenMap } = this.buildHistory(history, campground.aiAnonymizationLevel ?? "moderate");
    const mergedTokenMap = this.mergeTokenMaps(tokenMap, historyTokenMap);

    const systemPrompt = this.buildSystemPrompt({
      mode,
      campgroundName: campground.name,
      role,
      campgroundId: campground.id
    });

    const userPrompt = this.buildUserPrompt({
      anonymizedText,
      historyText,
      campgroundName: campground.name,
      campgroundId: campground.id,
      userId: user?.id,
      role,
      mode
    });

    let toolResponse;
    try {
      toolResponse = await this.provider.getToolCompletion({
        campgroundId,
        featureType: AiFeatureType.reply_assist,
        systemPrompt,
        userPrompt,
        userId: user?.id,
        sessionId,
        tools: this.buildTools()
      });
    } catch (err) {
      this.logger.warn("AI partner tool call failed", err instanceof Error ? err.message : `${err}`);
      return {
        mode,
        message: "I had trouble analyzing that request. Try rephrasing or be more specific."
      };
    }

    const toolCall = this.pickToolCall(toolResponse.toolCalls);
    if (!toolCall) {
      const fallback = toolResponse.content?.trim();
      return {
        mode,
        message: fallback ? this.privacy.deanonymize(fallback, mergedTokenMap) : "Tell me what you want to do and I can draft the steps."
      };
    }

    const aiResult = this.parseToolArgs(toolCall.arguments);
    if (!aiResult) {
      return {
        mode,
        message: "I couldn't understand that request. Can you restate it?",
        denials: [{ reason: "Unable to parse action request." }]
      };
    }

    const responseMessage = this.privacy.deanonymize(aiResult.message || "", mergedTokenMap).trim();
    const questions = (aiResult.questions || []).map((q: string) => this.privacy.deanonymize(q, mergedTokenMap));

    if (aiResult.denial?.reason) {
      return {
        mode,
        message: responseMessage || aiResult.denial.reason,
        denials: [
          {
            reason: aiResult.denial.reason,
            guidance: aiResult.denial.guidance
          }
        ],
        questions: questions.length ? questions : undefined
      };
    }

    const actionType = (aiResult.action?.type || "none") as ActionType;
    if (actionType === "none") {
      return {
        mode,
        message: responseMessage || "How can I help?",
        questions: questions.length ? questions : undefined
      };
    }

    const registry = ACTION_REGISTRY[actionType as Exclude<ActionType, "none">];
    if (!registry) {
      return {
        mode,
        message: responseMessage || "That action isn't available yet.",
        denials: [{ reason: "Action not supported by AI partner." }],
        questions: questions.length ? questions : undefined
      };
    }

    const access = await this.permissions.checkAccess({
      user,
      campgroundId,
      resource: registry.resource,
      action: registry.action
    });
    if (!access.allowed) {
      return {
        mode,
        message: responseMessage || "You don't have permission to do that.",
        denials: [{ reason: "Permission denied for this action." }]
      };
    }

    const draftId = randomUUID();
    const resolvedParameters = this.resolveParameters(aiResult.action?.parameters || {}, mergedTokenMap);
    const impact = await this.evaluateImpact({
      campgroundId,
      actionType,
      impactArea: aiResult.action?.impactArea || registry.impactArea,
      parameters: resolvedParameters
    });

    const requiresConfirmation =
      registry.confirmByDefault ||
      aiResult.action?.requiresConfirmation ||
      (mode === "admin" && (impact?.level === "high" || registry.sensitivity !== "low"));

    const actionDraft: ActionDraft = {
      id: draftId,
      actionType,
      resource: registry.resource,
      action: registry.action,
      parameters: resolvedParameters,
      status: "draft",
      requiresConfirmation,
      sensitivity: aiResult.action?.sensitivity || registry.sensitivity,
      impactArea: aiResult.action?.impactArea || registry.impactArea,
      impact: impact ?? undefined,
      evidenceLinks: this.buildEvidenceLinks(actionType, resolvedParameters)
    };

    if (registry.action === "read" && !requiresConfirmation) {
      const executed = await this.executeReadAction(campground, actionDraft);
      if (executed) {
        return {
          mode,
          message: executed.message,
          actionDrafts: [executed.action],
          evidenceLinks: executed.action.evidenceLinks,
          questions: questions.length ? questions : undefined
        };
      }
    }

    if (registry.action === "write" && actionType === "create_hold" && !requiresConfirmation) {
      const executed = await this.executeHold(campground, actionDraft, user);
      if (executed) {
        return {
          mode,
          message: executed.message,
          actionDrafts: [executed.action],
          evidenceLinks: executed.action.evidenceLinks,
          questions: questions.length ? questions : undefined
        };
      }
    }

    await this.audit.record({
      campgroundId,
      actorId: user?.id ?? null,
      action: "ai.partner.draft",
      entity: "ai_action",
      entityId: draftId,
      after: {
        actionType,
        parameters: resolvedParameters,
        impact
      }
    });

    return {
      mode,
      message: responseMessage || "I drafted the action below.",
      actionDrafts: [actionDraft],
      confirmations: requiresConfirmation
        ? [{ id: draftId, prompt: "Confirm this action?" }]
        : undefined,
      questions: questions.length ? questions : undefined,
      evidenceLinks: actionDraft.evidenceLinks
    };
  }

  private buildTools() {
    return [
      {
        type: "function",
        function: {
          name: "assistant_response",
          description: "Return a structured response with an optional action draft.",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string" },
              action: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["lookup_availability", "create_hold", "move_reservation", "adjust_rate", "none"]
                  },
                  parameters: { type: "object" },
                  sensitivity: { type: "string", enum: ["low", "medium", "high"] },
                  impactArea: { type: "string", enum: ["availability", "pricing", "policy", "revenue", "operations", "none"] },
                  summary: { type: "string" },
                  requiresConfirmation: { type: "boolean" }
                },
                required: ["type"]
              },
              questions: {
                type: "array",
                items: { type: "string" }
              },
              denial: {
                type: "object",
                properties: {
                  reason: { type: "string" },
                  guidance: { type: "string" }
                }
              }
            },
            required: ["message", "action"]
          }
        }
      }
    ];
  }

  private buildSystemPrompt(params: { mode: PartnerMode; campgroundName: string; role: string; campgroundId: string }) {
    return `You are the Active Campground AI Partner for ${params.campgroundName}.
MODE: ${params.mode.toUpperCase()}
ROLE: ${params.role}
PARK_SCOPE: ${params.campgroundId}

Behavior:
- Staff mode: fast, direct, minimal verbosity.
- Admin mode: strategic and cautious. Require confirmation for sensitive actions.

Privacy rules:
- Never request or expose personal data. Any identifiers appear as tokens like [NAME_1], [EMAIL_1].
- Do not ask for names, emails, phone numbers, or payment details.

Allowed actions (must map to one of these):
- lookup_availability (read-only)
- create_hold (write: place a temporary hold)
- move_reservation (write: draft only)
- adjust_rate (write: draft only)
- none

For pricing/availability/policy/revenue-impacting actions:
- Mark sensitivity as medium/high.
- Include a short summary of impact and set requiresConfirmation if risky.

Output contract:
- Provide action drafts, confirmations, denials, and evidence when applicable.
- Use the assistant_response tool only.

Return your output exclusively via the assistant_response tool.`;
  }

  private buildUserPrompt(params: {
    anonymizedText: string;
    historyText: string;
    campgroundName: string;
    campgroundId: string;
    userId?: string;
    role: string;
    mode: PartnerMode;
  }) {
    const historyBlock = params.historyText ? `\n\nRecent history:\n${params.historyText}` : "";
    return `Campground: ${params.campgroundName}
Campground ID: ${params.campgroundId}
User ID: ${params.userId ?? "unknown"}
User Role: ${params.role}
Mode: ${params.mode}

User request: "${params.anonymizedText}"${historyBlock}`;
  }

  private buildHistory(history: { role: "user" | "assistant"; content: string }[], level: "strict" | "moderate" | "minimal") {
    if (!history.length) return { historyText: "", historyTokenMap: new Map<string, string>() };
    const tokenMap = new Map<string, string>();
    const lines = history.slice(-6).map((entry) => {
      const result = this.privacy.anonymize(entry.content, level);
      result.tokenMap.forEach((value, key) => tokenMap.set(key, value));
      return `${entry.role.toUpperCase()}: ${result.anonymizedText}`;
    });
    return { historyText: lines.join("\n"), historyTokenMap: tokenMap };
  }

  private mergeTokenMaps(a: Map<string, string>, b: Map<string, string>) {
    const merged = new Map<string, string>();
    a.forEach((value, key) => merged.set(key, value));
    b.forEach((value, key) => merged.set(key, value));
    return merged;
  }

  private resolveUserRole(user: any, campgroundId: string): { role: string; mode: PartnerMode } {
    const ownership = Array.isArray(user?.ownershipRoles) ? user.ownershipRoles : [];
    if (ownership.includes("owner")) {
      return { role: "owner", mode: "admin" };
    }

    if (user?.role) {
      const role = user.role as UserRole;
      return { role, mode: role === UserRole.owner || role === UserRole.manager || role === UserRole.finance ? "admin" : "staff" };
    }

    const membership = user?.memberships?.find((m: any) => m.campgroundId === campgroundId);
    const membershipRole = membership?.role as UserRole | undefined;
    if (membershipRole) {
      return {
        role: membershipRole,
        mode: membershipRole === UserRole.owner || membershipRole === UserRole.manager || membershipRole === UserRole.finance ? "admin" : "staff"
      };
    }

    if (user?.platformRole === "platform_admin") {
      return { role: "platform_admin", mode: "admin" };
    }

    return { role: "staff", mode: "staff" };
  }

  private pickToolCall(toolCalls?: { name: string; arguments: string }[]) {
    if (!toolCalls?.length) return null;
    return toolCalls.find((call) => call.name === "assistant_response") ?? toolCalls[0];
  }

  private parseToolArgs(args: string) {
    try {
      return JSON.parse(args);
    } catch {
      return null;
    }
  }

  private resolveParameters(parameters: Record<string, any>, tokenMap: Map<string, string>) {
    const resolved: Record<string, any> = Array.isArray(parameters) ? [] : {};
    for (const [key, value] of Object.entries(parameters || {})) {
      resolved[key] = this.resolveValue(value, tokenMap);
    }
    return resolved;
  }

  private resolveValue(value: any, tokenMap: Map<string, string>) {
    if (typeof value === "string") {
      return tokenMap.get(value) ?? value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, tokenMap));
    }
    if (value && typeof value === "object") {
      return this.resolveParameters(value as Record<string, any>, tokenMap);
    }
    return value;
  }

  private async executeReadAction(campground: { id: string; slug: string; name: string }, draft: ActionDraft) {
    if (draft.actionType !== "lookup_availability") return null;
    const { arrivalDate, departureDate, rigType, rigLength } = draft.parameters;
    if (!arrivalDate || !departureDate) {
      return null;
    }

    try {
      const availability = await this.publicReservations.getAvailability(
        campground.slug,
        arrivalDate,
        departureDate,
        rigType,
        rigLength ? String(rigLength) : undefined,
        false
      );
      const availableCount = availability.filter((site: any) => site.status === "available").length;
      const byClass = new Map<string, number>();
      availability.forEach((site: any) => {
        if (site.status !== "available" || !site.siteClass?.name) return;
        byClass.set(site.siteClass.name, (byClass.get(site.siteClass.name) || 0) + 1);
      });

      const summary = byClass.size
        ? Array.from(byClass.entries())
          .map(([name, count]) => `${name}: ${count}`)
          .join(", ")
        : "No available sites";

      const action: ActionDraft = {
        ...draft,
        status: "executed",
        result: {
          availableCount,
          classSummary: summary
        }
      };

      await this.audit.record({
        campgroundId: campground.id,
        actorId: null,
        action: "ai.partner.execute",
        entity: "availability",
        entityId: draft.id,
        after: action.result ?? {}
      });

      return {
        action,
        message: `Availability from ${arrivalDate} to ${departureDate}: ${availableCount} sites open. ${summary}.`
      };
    } catch (err) {
      this.logger.warn("Availability lookup failed", err instanceof Error ? err.message : `${err}`);
      return null;
    }
  }

  private async executeHold(campground: { id: string }, draft: ActionDraft, user: any) {
    const { siteId, siteNumber, arrivalDate, departureDate, holdMinutes } = draft.parameters;
    if (!arrivalDate || !departureDate) return null;

    let resolvedSiteId = siteId as string | undefined;
    if (!resolvedSiteId && siteNumber) {
      const site = await this.prisma.site.findFirst({
        where: { campgroundId: campground.id, siteNumber: String(siteNumber) },
        select: { id: true }
      });
      resolvedSiteId = site?.id;
    }
    if (!resolvedSiteId) return null;

    try {
      const hold = await this.holds.create({
        campgroundId: campground.id,
        siteId: resolvedSiteId,
        arrivalDate,
        departureDate,
        holdMinutes: holdMinutes ?? 30
      });

      const action: ActionDraft = {
        ...draft,
        status: "executed",
        result: { holdId: hold.id, expiresAt: hold.expiresAt }
      };

      await this.audit.record({
        campgroundId: campground.id,
        actorId: user?.id ?? null,
        action: "ai.partner.execute",
        entity: "siteHold",
        entityId: hold.id,
        after: { siteId: resolvedSiteId, arrivalDate, departureDate }
      });

      return {
        action,
        message: `Hold placed on site ${siteNumber ?? resolvedSiteId} from ${arrivalDate} to ${departureDate}.`
      };
    } catch (err) {
      this.logger.warn("Hold creation failed", err instanceof Error ? err.message : `${err}`);
      return null;
    }
  }

  private buildEvidenceLinks(actionType: ActionType, parameters: Record<string, any>): EvidenceLink[] {
    if (actionType === "lookup_availability") {
      const params = new URLSearchParams();
      if (parameters.arrivalDate) params.set("arrivalDate", parameters.arrivalDate);
      if (parameters.departureDate) params.set("departureDate", parameters.departureDate);
      return [{ label: "Calendar view", url: `/calendar?${params.toString()}` }];
    }
    if (actionType === "create_hold") {
      const params = new URLSearchParams();
      if (parameters.arrivalDate) params.set("arrivalDate", parameters.arrivalDate);
      if (parameters.departureDate) params.set("departureDate", parameters.departureDate);
      if (parameters.siteId) params.set("siteId", parameters.siteId);
      return [{ label: "Calendar hold", url: `/calendar?${params.toString()}` }];
    }
    if (actionType === "move_reservation" && parameters.reservationId) {
      return [{ label: "Reservation", url: `/reservations/${parameters.reservationId}` }];
    }
    if (actionType === "adjust_rate") {
      return [{ label: "Pricing rules", url: "/pricing" }];
    }
    return [];
  }

  private async evaluateImpact(params: {
    campgroundId: string;
    actionType: ActionType;
    impactArea: ImpactArea;
    parameters: Record<string, any>;
  }): Promise<ImpactSummary | null> {
    if (!["availability", "pricing", "policy", "revenue"].includes(params.impactArea)) {
      return null;
    }

    const now = new Date();
    const windowStart = params.parameters.arrivalDate ? new Date(params.parameters.arrivalDate) : now;
    const windowEnd = params.parameters.departureDate
      ? new Date(params.parameters.departureDate)
      : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [siteCount, overlappingReservations, recentBookings] = await Promise.all([
      this.prisma.site.count({ where: { campgroundId: params.campgroundId, isActive: true } }),
      this.prisma.reservation.count({
        where: {
          campgroundId: params.campgroundId,
          status: { not: "cancelled" },
          departureDate: { gt: windowStart },
          arrivalDate: { lt: windowEnd }
        }
      }),
      this.prisma.reservation.count({
        where: {
          campgroundId: params.campgroundId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const occupancy = siteCount > 0 ? overlappingReservations / siteCount : 0;
    const warnings: string[] = [];
    let level: "low" | "medium" | "high" = "low";

    if (occupancy >= 0.9) {
      level = "high";
      warnings.push("Occupancy is above 90% in the selected window.");
    } else if (occupancy >= 0.75) {
      level = "medium";
      warnings.push("Occupancy is trending high in the selected window.");
    }

    if (recentBookings > Math.max(5, siteCount * 0.2)) {
      level = level === "high" ? level : "medium";
      warnings.push("Booking velocity is elevated this week.");
    }

    const summary = `Occupancy estimate: ${(occupancy * 100).toFixed(0)}% (${overlappingReservations}/${siteCount} sites) over the next ${Math.max(1, Math.round((windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000)))} days.`;
    const saferAlternative = params.actionType === "adjust_rate"
      ? "Consider a smaller rate test (e.g., +3%) or limit the change to weekends."
      : params.actionType === "move_reservation"
        ? "Consider a temporary hold or offer an alternate site in the same class first."
        : undefined;

    return {
      level,
      summary,
      warnings: warnings.length ? warnings : undefined,
      saferAlternative
    };
  }
}
