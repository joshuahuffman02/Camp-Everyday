import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  campgroundId!: string;

  @IsOptional()
  @IsString()
  siteClassId?: string | null;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  siteNumber!: string;

  @IsString()
  @IsNotEmpty()
  siteType!: string;

  @IsInt()
  @Min(0)
  maxOccupancy!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rigMaxLength?: number;

  @IsOptional()
  @IsBoolean()
  hookupsPower?: boolean;

  @IsOptional()
  @IsBoolean()
  hookupsWater?: boolean;

  @IsOptional()
  @IsBoolean()
  hookupsSewer?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  powerAmps?: number;

  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;

  @IsOptional()
  @IsBoolean()
  accessible?: boolean;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsInt()
  minNights?: number;

  @IsOptional()
  @IsInt()
  maxNights?: number;

  @IsOptional()
  photos?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tags?: string[];
}
