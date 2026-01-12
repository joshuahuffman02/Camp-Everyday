import { IsIn, IsOptional, IsString } from "class-validator";

type SignatureWebhookStatus = "signed" | "declined" | "voided" | "expired" | "viewed";

const STATUSES: SignatureWebhookStatus[] = ["signed", "declined", "voided", "expired", "viewed"];

export class SignatureWebhookDto {
  @IsString()
  token!: string;

  @IsIn(STATUSES)
  status!: SignatureWebhookStatus;

  @IsOptional()
  @IsString()
  pdfUrl?: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  completedAt?: string;
}
