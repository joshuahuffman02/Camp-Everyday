import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString } from "class-validator";

const SIGNATURE_TYPES = ["long_term_stay", "seasonal", "monthly", "park_rules", "deposit", "waiver", "coi", "other"] as const;
const DELIVERY_CHANNELS = ["email", "sms", "email_and_sms"] as const;
const SIGNATURE_METHODS = ["digital", "paper", "waived"] as const;

export class CreateSignatureRequestDto {
  @IsOptional()
  @IsString()
  campgroundId?: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsIn(SIGNATURE_TYPES as unknown as string[])
  documentType?: (typeof SIGNATURE_TYPES)[number];

  @IsOptional()
  @IsIn(DELIVERY_CHANNELS as unknown as string[])
  deliveryChannel?: (typeof DELIVERY_CHANNELS)[number];

  @IsOptional()
  @IsIn(SIGNATURE_METHODS as unknown as string[])
  signatureMethod?: (typeof SIGNATURE_METHODS)[number];

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  reminderAt?: string;

  @IsOptional()
  @IsString()
  previewAvailableAt?: string;

  @IsOptional()
  @IsString()
  availableForSigningAt?: string;

  @IsOptional()
  @IsString()
  renewsContractId?: string;

  @IsOptional()
  @IsInt()
  seasonYear?: number;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
