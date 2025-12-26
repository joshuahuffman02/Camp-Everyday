import { IsArray, IsIn, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

const DELIVERY_CHANNELS = ["email", "sms", "email_and_sms"] as const;

export class RenewalRecipient {
  @IsString()
  guestId: string;

  @IsOptional()
  @IsString()
  reservationId?: string; // Previous reservation if known

  @IsOptional()
  @IsString()
  previousContractId?: string; // Previous contract to renew

  @IsOptional()
  @IsString()
  siteId?: string; // Site assignment for renewal
}

export class SendRenewalCampaignDto {
  @IsString()
  campgroundId: string;

  @IsString()
  templateId: string; // Document template to use

  @IsInt()
  seasonYear: number; // e.g., 2026

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RenewalRecipient)
  recipients: RenewalRecipient[];

  @IsOptional()
  @IsIn(DELIVERY_CHANNELS as unknown as string[])
  deliveryChannel?: (typeof DELIVERY_CHANNELS)[number];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // Common expiry for all contracts

  @IsOptional()
  @IsString()
  previewAvailableAt?: string; // When preview becomes available

  @IsOptional()
  @IsString()
  availableForSigningAt?: string; // When signing opens
}
