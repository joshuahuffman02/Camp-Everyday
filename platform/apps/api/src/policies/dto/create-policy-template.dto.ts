import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from "class-validator";

export class CreatePolicyTemplateDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;

  @IsOptional()
  @IsString()
  siteClassId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsObject()
  policyConfig?: Record<string, unknown>;
}
