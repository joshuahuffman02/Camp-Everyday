import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateSiteClassDto {
  @IsString()
  @IsNotEmpty()
  campgroundId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  defaultRate!: number;

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
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  glCode?: string;

  @IsOptional()
  @IsString()
  clientAccount?: string;

  @IsOptional()
  @IsInt()
  minNights?: number;

  @IsOptional()
  @IsInt()
  maxNights?: number;

  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;

  @IsOptional()
  @IsBoolean()
  accessible?: boolean;

  @IsOptional()
  photos?: string[];

  @IsOptional()
  policyVersion?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
