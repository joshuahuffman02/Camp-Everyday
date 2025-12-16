import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AnomalyCheckDto } from "./dto/anomaly-check.dto";

export interface AnomalyAlert {
    id: string;
    type: "occupancy_drop" | "revenue_spike" | "system_error";
    severity: "low" | "medium" | "high";
    message: string;
    detectedAt: Date;
    metadata?: Record<string, any>;
}

@Injectable()
export class AnomaliesService {
    private readonly logger = new Logger(AnomaliesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async check(dto: AnomalyCheckDto): Promise<AnomalyAlert[]> {
        const alerts: AnomalyAlert[] = [];

        // Simple mock logic for scaffolding:
        // Check if yesterday's occupancy was below 10% (stub)

        const occupancy = await this.getMockOccupancy(dto.campgroundId);

        if (occupancy < 10) {
            alerts.push({
                id: `alert-${Date.now()}`,
                type: "occupancy_drop",
                severity: "high",
                message: `Occupancy dropped to ${occupancy}% yesterday (below threshold of 10%)`,
                detectedAt: new Date(),
                metadata: { occupancy },
            });
        }

        return alerts;
    }

    private async getMockOccupancy(campgroundId: string): Promise<number> {
        // In real implementation, query Prisma FactReservationsDaily
        // For scaffolding, return random number
        return Math.floor(Math.random() * 20);
    }
}
