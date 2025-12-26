import { IsInt, IsOptional, IsString } from "class-validator";

export class ContractStatsQueryDto {
  @IsString()
  campgroundId: string;

  @IsOptional()
  @IsInt()
  seasonYear?: number;

  @IsOptional()
  @IsString()
  documentType?: string; // Filter by document type (seasonal, long_term_stay, etc.)
}

export interface ContractStats {
  total: number;
  preview: number;
  draft: number;
  sent: number;
  viewed: number;
  signed: number;
  signedPaper: number;
  waived: number;
  declined: number;
  expired: number;
  voided: number;
  completionRate: number; // Percentage of signed + signed_paper + waived
  pendingCount: number; // sent + viewed (needs action)
  daysUntilDeadline?: number; // If there's a common expiry deadline
}
