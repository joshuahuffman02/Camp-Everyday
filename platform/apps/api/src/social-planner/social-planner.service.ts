import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SocialAlertCategory, SocialPostStatus, SocialSuggestionStatus, SocialSuggestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateAlertDto,
    CreateAssetDto,
    PerformanceInputDto,
    CreatePostDto,
    CreateStrategyDto,
    CreateSuggestionDto,
    CreateTemplateDto,
    UpdateAssetDto,
    UpdatePostDto,
    UpdateSuggestionStatusDto,
    UpdateTemplateDto,
} from './dto/social-planner.dto';

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const toDate = (value?: Date | string | null) => {
    if (!value) return undefined;
    return typeof value === 'string' ? new Date(value) : value;
};

@Injectable()
export class SocialPlannerService {
    private readonly logger = new Logger(SocialPlannerService.name);

    constructor(private readonly prisma: PrismaService) { }

    // Posts
    async listPosts(campgroundId: string) {
        return this.prisma.socialPost.findMany({
            where: { campgroundId },
            orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
            include: { template: true, suggestion: true },
        });
    }

    async getPost(id: string) {
        return this.prisma.socialPost.findUnique({ where: { id }, include: { template: true, suggestion: true } });
    }

    async createPost(dto: CreatePostDto) {
        const data: Prisma.SocialPostCreateInput = {
            campground: { connect: { id: dto.campgroundId } },
            title: dto.title,
            platform: dto.platform as any,
            status: (dto.status || SocialPostStatus.draft) as SocialPostStatus,
            category: dto.category as any,
            scheduledFor: toDate(dto.scheduledFor) ?? null,
            publishedFor: toDate(dto.publishedFor) ?? null,
            caption: dto.caption ?? null,
            hashtags: dto.hashtags ?? [],
            imagePrompt: dto.imagePrompt ?? null,
            notes: dto.notes ?? null,
            template: dto.templateId ? { connect: { id: dto.templateId } } : undefined,
            assetUrls: dto.assetUrls ?? [],
            tags: dto.tags ?? [],
            ideaParkingLot: dto.ideaParkingLot ?? false,
            suggestion: dto.suggestionId ? { connect: { id: dto.suggestionId } } : undefined,
        };
        return this.prisma.socialPost.create({ data });
    }

    async updatePost(id: string, dto: UpdatePostDto) {
        const data: Prisma.SocialPostUpdateInput = {
            title: dto.title,
            platform: dto.platform as any,
            status: dto.status as any,
            category: dto.category as any,
            scheduledFor: dto.scheduledFor === undefined ? undefined : (toDate(dto.scheduledFor) ?? null),
            publishedFor: dto.publishedFor === undefined ? undefined : (toDate(dto.publishedFor) ?? null),
            caption: dto.caption,
            hashtags: dto.hashtags,
            imagePrompt: dto.imagePrompt,
            notes: dto.notes,
            assetUrls: dto.assetUrls,
            tags: dto.tags,
            ideaParkingLot: dto.ideaParkingLot,
            template: dto.templateId ? { connect: { id: dto.templateId } } : dto.templateId === null ? { disconnect: true } : undefined,
            suggestion: dto.suggestionId ? { connect: { id: dto.suggestionId } } : dto.suggestionId === null ? { disconnect: true } : undefined,
        };
        return this.prisma.socialPost.update({ where: { id }, data });
    }

    async deletePost(id: string) {
        return this.prisma.socialPost.delete({ where: { id } });
    }

    // Templates
    async listTemplates(campgroundId: string) {
        return this.prisma.socialTemplate.findMany({ where: { campgroundId }, orderBy: [{ createdAt: 'desc' }] });
    }

    async createTemplate(dto: CreateTemplateDto) {
        const data: Prisma.SocialTemplateCreateInput = {
            campground: { connect: { id: dto.campgroundId } },
            name: dto.name,
            summary: dto.summary ?? null,
            category: dto.category as any,
            style: dto.style as any,
            defaultCaption: dto.defaultCaption ?? null,
            captionFillIns: dto.captionFillIns ?? null,
            imageGuidance: dto.imageGuidance ?? null,
            hashtagSet: dto.hashtagSet ?? [],
            bestTime: dto.bestTime ?? null,
        };
        return this.prisma.socialTemplate.create({ data });
    }

    async updateTemplate(id: string, dto: UpdateTemplateDto) {
        const data: Prisma.SocialTemplateUpdateInput = {
            name: dto.name,
            summary: dto.summary,
            category: dto.category as any,
            style: dto.style as any,
            defaultCaption: dto.defaultCaption,
            captionFillIns: dto.captionFillIns,
            imageGuidance: dto.imageGuidance,
            hashtagSet: dto.hashtagSet,
            bestTime: dto.bestTime,
        };
        return this.prisma.socialTemplate.update({ where: { id }, data });
    }

    async deleteTemplate(id: string) {
        return this.prisma.socialTemplate.delete({ where: { id } });
    }

    // Assets (content bank)
    async listAssets(campgroundId: string) {
        return this.prisma.socialContentAsset.findMany({ where: { campgroundId }, orderBy: [{ createdAt: 'desc' }] });
    }

    async createAsset(dto: CreateAssetDto) {
        const data: Prisma.SocialContentAssetCreateInput = {
            campground: { connect: { id: dto.campgroundId } },
            title: dto.title,
            type: dto.type as any,
            url: dto.url,
            tags: dto.tags ?? [],
            notes: dto.notes ?? null,
            uploadedBy: dto.uploadedById ? { connect: { id: dto.uploadedById } } : undefined,
        };
        return this.prisma.socialContentAsset.create({ data });
    }

    async updateAsset(id: string, dto: UpdateAssetDto) {
        const data: Prisma.SocialContentAssetUpdateInput = {
            title: dto.title,
            type: dto.type as any,
            url: dto.url,
            tags: dto.tags,
            notes: dto.notes,
            uploadedBy: dto.uploadedById ? { connect: { id: dto.uploadedById } } : dto.uploadedById === null ? { disconnect: true } : undefined,
        };
        return this.prisma.socialContentAsset.update({ where: { id }, data });
    }

    async deleteAsset(id: string) {
        return this.prisma.socialContentAsset.delete({ where: { id } });
    }

    // Suggestions
    async listSuggestions(campgroundId: string, status?: SocialSuggestionStatus) {
        return this.prisma.socialSuggestion.findMany({
            where: { campgroundId, status: status || undefined },
            orderBy: [{ proposedDate: 'asc' }, { createdAt: 'desc' }],
        });
    }

    async createSuggestion(dto: CreateSuggestionDto) {
        const data: Prisma.SocialSuggestionCreateInput = {
            campground: { connect: { id: dto.campgroundId } },
            type: dto.type as any,
            status: (dto.status || SocialSuggestionStatus.new) as SocialSuggestionStatus,
            message: dto.message,
            reason: dto.reason,
            category: dto.category as any,
            platform: dto.platform as any,
            proposedDate: toDate(dto.proposedDate) ?? null,
            opportunityAt: toDate(dto.opportunityAt) ?? null
        };
        return this.prisma.socialSuggestion.create({ data });
    }

    async updateSuggestionStatus(id: string, dto: UpdateSuggestionStatusDto) {
        const data: Prisma.SocialSuggestionUpdateInput = {
            status: dto.status as any,
            // relation to post intentionally omitted in stub
        };
        return this.prisma.socialSuggestion.update({ where: { id }, data });
    }

    async refreshSuggestions(campgroundId: string) {
        // Remove existing NEW suggestions (we keep accepted/dismissed history)
        await this.prisma.socialSuggestion.deleteMany({
            where: { campgroundId, status: SocialSuggestionStatus.new },
        });

        const now = new Date();
        const recentExisting = await this.prisma.socialSuggestion.findMany({
            where: {
                campgroundId,
                createdAt: { gte: addDays(now, -7) },
            },
            select: { type: true, message: true, proposedDate: true },
        });

        const generated = await this.buildRuleBasedSuggestions(campgroundId);
        if (!generated.length) return this.listSuggestions(campgroundId);

        const norm = (msg: string) => msg.replace(/\s+/g, " ").trim().toLowerCase();
        const dayKey = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "none");
        const already = new Set(
            recentExisting.map((e) => `${e.type}::${norm(e.message)}::${dayKey(e.proposedDate as any)}`)
        );

        const deduped: Prisma.SocialSuggestionCreateManyInput[] = [];
        const seen = new Set<string>();

        for (const g of generated) {
            const key = `${g.type}::${norm(g.message)}::${dayKey(g.proposedDate as any)}`;
            if (seen.has(key) || already.has(key)) continue;
            seen.add(key);
            deduped.push(g);
        }

        if (deduped.length) {
            await this.prisma.socialSuggestion.createMany({ data: deduped });
        }
        return this.listSuggestions(campgroundId);
    }

    private async buildRuleBasedSuggestions(campgroundId: string): Promise<Prisma.SocialSuggestionCreateManyInput[]> {
        const now = new Date();
        const near = addDays(now, 14);
        const monthAhead = addDays(now, 45);
        const siteCount = await this.prisma.site.count({ where: { campgroundId } });
        const reservations = await this.prisma.reservation.count({
            where: {
                campgroundId,
                arrivalDate: { gte: now, lte: near },
                status: { in: ['confirmed', 'checked_in'] as any },
            },
        });

        const suggestions: Prisma.SocialSuggestionCreateManyInput[] = [];
        const occupancyRatio = siteCount > 0 ? reservations / siteCount : 0;
        if (occupancyRatio >= 0.85) {
            suggestions.push({
                id: undefined,
                campgroundId,
                type: SocialSuggestionType.occupancy,
                status: SocialSuggestionStatus.new,
                message: 'Cabins and premium sites are nearly full next weekend. Post a countdown and encourage early bookings.',
                category: 'occupancy' as any,
                platform: 'facebook' as any,
                proposedDate: near,
                opportunityAt: near,
                reason: { occupancyRatio, windowDays: 14 },
                createdAt: now,
                updatedAt: now,
            });
        } else if (siteCount > 0 && occupancyRatio <= 0.4) {
            suggestions.push({
                id: undefined,
                campgroundId,
                type: SocialSuggestionType.occupancy,
                status: SocialSuggestionStatus.new,
                message: 'Tent and RV sites are under 40% for the upcoming holiday window. Spotlight availability and a simple bundle.',
                category: 'occupancy' as any,
                platform: 'instagram' as any,
                proposedDate: near,
                opportunityAt: near,
                reason: { occupancyRatio, windowDays: 14 },
                createdAt: now,
                updatedAt: now,
            });
        }

        const events = await this.prisma.event.findMany({
            where: { campgroundId, isCancelled: false, startDate: { gte: now, lte: monthAhead } },
            select: { id: true, title: true, startDate: true, currentSignups: true, capacity: true },
            orderBy: { startDate: 'asc' },
        });
        events.forEach((event) => {
            const utilization = event.capacity ? event.currentSignups / event.capacity : 0;
            if (utilization < 0.5) {
                suggestions.push({
                    id: undefined,
                    campgroundId,
                    type: SocialSuggestionType.event,
                    status: SocialSuggestionStatus.new,
                    message: `${event.title} sign-ups are light. Post a reminder and add a quick RSVP link.`,
                    category: 'events' as any,
                    platform: 'facebook' as any,
                    proposedDate: event.startDate,
                    opportunityAt: event.startDate,
                    reason: { utilization, capacity: event.capacity, startDate: event.startDate },
                    createdAt: now,
                    updatedAt: now,
                });
            } else {
                suggestions.push({
                    id: undefined,
                    campgroundId,
                    type: SocialSuggestionType.event,
                    status: SocialSuggestionStatus.new,
                    message: `${event.title} is coming up. Run a teaser and behind-the-scenes post this week.`,
                    category: 'events' as any,
                    platform: 'instagram' as any,
                    proposedDate: addDays(event.startDate, -7),
                    opportunityAt: event.startDate,
                    reason: { startDate: event.startDate },
                    createdAt: now,
                    updatedAt: now,
                });
            }
        });

        const promotions = await this.prisma.promotion.findMany({
            where: {
                campgroundId,
                isActive: true,
                AND: [
                    { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
                    { OR: [{ validTo: null }, { validTo: { gte: now } }] },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
        promotions.forEach((promo) => {
            suggestions.push({
                id: undefined,
                campgroundId,
                type: SocialSuggestionType.deal,
                status: SocialSuggestionStatus.new,
                message: `Promote ${promo.code} — it has ${promo.usageCount} uses. Share how it works in a carousel.`,
                category: 'deals' as any,
                platform: 'instagram' as any,
                proposedDate: addDays(now, 2),
                opportunityAt: now,
                reason: { promotionId: promo.id, usageCount: promo.usageCount },
                createdAt: now,
                updatedAt: now,
            });
        });

        // Seasonal heuristics
        const month = now.getMonth(); // 0-based
        if (month === 9) {
            suggestions.push({
                id: undefined,
                campgroundId,
                type: SocialSuggestionType.seasonal,
                status: SocialSuggestionStatus.new,
                message: 'Halloween build-up: tease decorations, costume contests, and pumpkin carving.',
                category: 'holiday' as any,
                platform: 'facebook' as any,
                proposedDate: addDays(now, 3),
                opportunityAt: addDays(now, 7),
                reason: { season: 'halloween' },
                createdAt: now,
                updatedAt: now,
            });
        } else if (month === 5) {
            suggestions.push({
                id: undefined,
                campgroundId,
                type: SocialSuggestionType.seasonal,
                status: SocialSuggestionStatus.new,
                message: 'Pool opening season — share a countdown and first swim weekend.',
                category: 'pool' as any,
                platform: 'instagram' as any,
                proposedDate: addDays(now, 2),
                opportunityAt: addDays(now, 7),
                reason: { season: 'pool_opening' },
                createdAt: now,
                updatedAt: now,
            });
        }

        return suggestions;
    }

    // Weekly ideas (auto-generated)
    async generateWeeklyIdeas(campgroundId: string) {
        const anchor = this.getMondayAnchor(new Date());
        const existing = await this.prisma.socialWeeklyIdea.findUnique({ where: { campgroundId_generatedFor: { campgroundId, generatedFor: anchor } } });
        if (existing) return existing;
        const bundle = {
            posts: [
                { type: 'promotional', idea: 'Book-now highlight with an early-bird hook', platform: 'facebook' },
                { type: 'engagement', idea: 'Staff story or fun moment from the park', platform: 'instagram' },
                { type: 'behind_the_scenes', idea: 'Guest experience or UGC repost with a thank-you', platform: 'tiktok' },
            ],
            cadence: [
                { day: 'Tuesday', theme: 'Book-Now Highlight' },
                { day: 'Thursday', theme: 'Staff Story or Fun Moment' },
                { day: 'Saturday', theme: 'Guest Experience / UGC' },
            ],
        };
        return this.prisma.socialWeeklyIdea.create({
            data: {
                campground: { connect: { id: campgroundId } },
                generatedFor: anchor,
                ideas: bundle.posts as any,
                cadence: bundle.cadence as any,
            },
        });
    }

    private getMondayAnchor(date: Date) {
        const d = new Date(date);
        const day = d.getDay(); // 0 Sun
        const diff = (day === 0 ? -6 : 1 - day);
        d.setDate(d.getDate() + diff);
        // normalize to UTC midnight to avoid tz drift in tests/environments
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }

    // Strategy & alerts
    async createStrategy(dto: CreateStrategyDto) {
        return this.prisma.socialStrategy.create({
            data: {
                campground: { connect: { id: dto.campgroundId } },
                month: toDate(dto.month) || new Date(),
                annual: dto.annual ?? false,
                plan: dto.plan as any,
            },
        });
    }

    async listStrategies(campgroundId: string) {
        return this.prisma.socialStrategy.findMany({
            where: { campgroundId },
            orderBy: [{ month: 'desc' }],
        });
    }

    async createAlert(dto: CreateAlertDto) {
        return this.prisma.socialOpportunityAlert.create({
            data: {
                campground: { connect: { id: dto.campgroundId } },
                category: dto.category as SocialAlertCategory,
                message: dto.message,
                startsAt: toDate(dto.startsAt) ?? null,
                endsAt: toDate(dto.endsAt) ?? null,
            },
        });
    }

    async listAlerts(campgroundId: string) {
        return this.prisma.socialOpportunityAlert.findMany({
            where: { campgroundId },
            orderBy: [{ createdAt: 'desc' }],
        });
    }

    async dismissAlert(id: string) {
        return this.prisma.socialOpportunityAlert.update({ where: { id }, data: { dismissed: true } });
    }

    // Reporting & performance
    async recordPerformance(dto: PerformanceInputDto) {
        return this.prisma.socialPerformanceInput.create({
            data: {
                campground: { connect: { id: dto.campgroundId } },
                post: dto.postId ? { connect: { id: dto.postId } } : undefined,
                likes: dto.likes ?? null,
                reach: dto.reach ?? null,
                comments: dto.comments ?? null,
                saves: dto.saves ?? null,
                shares: dto.shares ?? null,
                notes: dto.notes ?? null,
                recordedAt: toDate(dto.recordedAt) ?? new Date(),
            },
        });
    }

    async reportSummary(campgroundId: string) {
        const [posts, templates, suggestions, performance] = await Promise.all([
            this.prisma.socialPost.count({ where: { campgroundId } }),
            this.prisma.socialTemplate.count({ where: { campgroundId } }),
            this.prisma.socialSuggestion.count({ where: { campgroundId, status: SocialSuggestionStatus.new } }),
            this.prisma.socialPerformanceInput.findMany({
                where: { campgroundId },
                select: { likes: true, reach: true, comments: true, shares: true, saves: true },
            }),
        ]);

        const metrics = performance.reduce<{ likes: number; reach: number; comments: number; shares: number; saves: number }>(
            (acc, row) => {
                acc.likes += row.likes ?? 0;
                acc.reach += row.reach ?? 0;
                acc.comments += row.comments ?? 0;
                acc.shares += row.shares ?? 0;
                acc.saves += row.saves ?? 0;
                return acc;
            },
            { likes: 0, reach: 0, comments: 0, shares: 0, saves: 0 },
        );

        return {
            posts,
            templates,
            openSuggestions: suggestions,
            performance: metrics,
        };
    }

    // Scheduler helpers
    async generateWeeklyIdeasForAllCampgrounds() {
        const camps = await this.prisma.campground.findMany({ select: { id: true } });
        for (const camp of camps) {
            try {
                await this.generateWeeklyIdeas(camp.id);
            } catch (err) {
                this.logger.error(`Failed to generate weekly ideas for ${camp.id}`, err as any);
            }
        }
    }
}

