import { IsIn, IsOptional, IsString } from "class-validator";

const WAIVER_REASONS = [
  "returning_same_terms",
  "corporate_agreement",
  "grandfathered",
  "family_member",
  "owner_discretion",
  "other"
] as const;

export class WaiveSignatureDto {
  @IsString()
  id: string;

  @IsIn(WAIVER_REASONS as unknown as string[])
  reason: (typeof WAIVER_REASONS)[number];

  @IsOptional()
  @IsString()
  notes?: string; // Required if reason is "other"
}
