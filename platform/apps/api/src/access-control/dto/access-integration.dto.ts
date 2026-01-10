import { AccessProviderType } from "@prisma/client";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class UpsertAccessIntegrationDto {
  @IsString()
  provider!: AccessProviderType;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsObject()
  credentials!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
