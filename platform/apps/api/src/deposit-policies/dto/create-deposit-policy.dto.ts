import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { DepositApplyTo, DepositDueTiming, DepositStrategy } from "@prisma/client";

// Guarded enums to avoid runtime undefined when prisma client enums are missing
const DepositStrategyGuard =
  DepositStrategy ?? ({ first_night: "first_night", percent: "percent", fixed: "fixed" } as const);
const DepositApplyToGuard =
  DepositApplyTo ?? ({ lodging_only: "lodging_only", lodging_plus_fees: "lodging_plus_fees" } as const);
const DepositDueTimingGuard =
  DepositDueTiming ?? ({ at_booking: "at_booking", before_arrival: "before_arrival" } as const);

export class CreateDepositPolicyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(DepositStrategyGuard)
  strategy!: DepositStrategy;

  @IsInt()
  value!: number;

  @IsOptional()
  @IsInt()
  minCap?: number | null;

  @IsOptional()
  @IsInt()
  maxCap?: number | null;

  @IsEnum(DepositApplyToGuard)
  applyTo!: DepositApplyTo;

  @IsEnum(DepositDueTimingGuard)
  dueTiming!: DepositDueTiming;

  @IsOptional()
  @IsString()
  siteClassId?: string | null;

  @IsOptional()
  @IsString()
  retryPlanId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

