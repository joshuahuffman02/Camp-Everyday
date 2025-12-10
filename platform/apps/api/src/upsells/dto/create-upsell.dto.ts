import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { UpsellPriceType } from "@prisma/client";

// Guard to prevent undefined enum when prisma client isn't generated
const UpsellPriceTypeGuard = UpsellPriceType ?? ({ flat: "flat", percent: "percent" } as const);

export class CreateUpsellDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(UpsellPriceTypeGuard)
  priceType!: UpsellPriceType;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  taxCode?: string | null;

  @IsOptional()
  @IsBoolean()
  inventoryTracking?: boolean;

  @IsOptional()
  @IsString()
  siteClassId?: string | null;
}

