import { Injectable } from '@nestjs/common';
import { Guest, Site, Reservation, SiteClass } from '@prisma/client';

export interface MatchResult {
    score: number;
    reasons: string[];
}

@Injectable()
export class MatchScoreService {
    calculateMatchScore(
        guest: Guest & { reservations?: (Reservation & { site: Site | null })[] },
        site: Site & { siteClass?: SiteClass | null }
    ): MatchResult {
        let score = 50;
        const reasons: string[] = [];

        // 1. Hard Constraints (Safety check, though usually filtered beforehand)
        if (guest.rigLength && site.rigMaxLength && guest.rigLength > site.rigMaxLength) {
            return { score: 0, reasons: ['Rig too long for site'] };
        }

        // 2. History
        const pastReservations = guest.reservations || [];
        const hasStayedInSite = pastReservations.some(r => r.siteId === site.id);
        const hasStayedInClass = pastReservations.some(r => r.site?.siteClassId === site.siteClassId);

        if (hasStayedInSite) {
            score += 30;
            reasons.push('Guest has stayed in this specific site before');
        } else if (hasStayedInClass) {
            score += 15;
            reasons.push('Guest has stayed in this site class before');
        }

        // 3. Preferences vs Vibe Tags
        // guest.preferences is Json, we need to cast it safely
        const preferences = guest.preferences as Record<string, unknown> || {};
        const vibeTags = site.vibeTags || [];

        // Example preference: { "secluded": true, "view": "lake" }
        // Example tags: ["Secluded", "Lake View"]

        // Check for boolean preferences matching tags
        if (preferences.secluded && vibeTags.includes('Secluded')) {
            score += 15;
            reasons.push('Matches preference: Secluded location');
        }

        if (preferences.shade && vibeTags.includes('Shade')) {
            score += 10;
            reasons.push('Matches preference: Shaded site');
        }

        if (preferences.nearBathrooms && vibeTags.includes('Near Bathrooms')) {
            score += 10;
            reasons.push('Close to restrooms (accessibility)');
        }

        // Additional common vibe tag matches
        if (vibeTags.includes('Waterfront') || vibeTags.includes('Lake View') || vibeTags.includes('River View')) {
            score += 8;
            reasons.push('Premium waterfront location');
        }

        if (vibeTags.includes('Pull-Through') && guest.rigLength) {
            score += 12;
            reasons.push('Easy pull-through access for RV');
        }

        if (vibeTags.includes('ADA') || vibeTags.includes('Accessible')) {
            score += 5;
            reasons.push('ADA accessible site');
        }

        if (vibeTags.includes('Pet Friendly') && preferences.pets) {
            score += 8;
            reasons.push('Pet-friendly amenities');
        }

        // 4. Rig Length Compatibility
        if (guest.rigLength && site.rigMaxLength) {
            const lengthBuffer = site.rigMaxLength - guest.rigLength;
            if (lengthBuffer >= 10) {
                score += 8;
                reasons.push('Spacious fit for your rig');
            } else if (lengthBuffer >= 0) {
                score += 3;
                reasons.push('Compatible rig length');
            }
        }

        // 5. Popularity
        if (site.popularityScore) {
            const popularityBonus = Math.round(site.popularityScore / 5); // Max +20 points
            score += popularityBonus;
            if (site.popularityScore >= 80) {
                reasons.push('Highly rated by previous guests');
            }
        }

        // 6. Default rate value indicator
        if (site.defaultRate && site.siteClass?.defaultRate) {
            if (site.defaultRate <= site.siteClass.defaultRate * 0.9) {
                score += 5;
                reasons.push('Best value in class');
            }
        }

        // Cap score
        return {
            score: Math.min(100, Math.max(0, score)),
            reasons
        };
    }
}
