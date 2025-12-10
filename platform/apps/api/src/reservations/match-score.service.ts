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
        const preferences = guest.preferences as Record<string, any> || {};
        const vibeTags = site.vibeTags || [];

        // Example preference: { "secluded": true, "view": "lake" }
        // Example tags: ["Secluded", "Lake View"]

        // Check for boolean preferences matching tags
        if (preferences.secluded && vibeTags.includes('Secluded')) {
            score += 15;
            reasons.push('Matches preference: Secluded');
        }

        if (preferences.shade && vibeTags.includes('Shade')) {
            score += 10;
            reasons.push('Matches preference: Shade');
        }

        if (preferences.nearBathrooms && vibeTags.includes('Near Bathrooms')) {
            score += 10;
            reasons.push('Matches preference: Near Bathrooms');
        }

        // 4. Popularity
        if (site.popularityScore) {
            score += Math.round(site.popularityScore / 5); // Max +20 points
        }

        // Cap score
        return {
            score: Math.min(100, Math.max(0, score)),
            reasons
        };
    }
}
