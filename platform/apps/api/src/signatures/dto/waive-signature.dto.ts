import { IsIn, IsOptional, IsString } from "class-validator";
import { WaiverReason } from "@prisma/client";

const WAIVER_REASONS = [
  WaiverReason.returning_same_terms,
  WaiverReason.corporate_agreement,
  WaiverReason.grandfathered,
  WaiverReason.family_member,
  WaiverReason.owner_discretion,
  WaiverReason.other,
];

export class WaiveSignatureDto {
  @IsString()
  id!: string;

  @IsIn(WAIVER_REASONS)
  reason!: WaiverReason;

  @IsOptional()
  @IsString()
  notes?: string; // Required if reason is "other"
}
