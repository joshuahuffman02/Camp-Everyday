import { IsIn, IsOptional, IsString } from "class-validator";

type CoiStatus = "pending" | "active" | "expired" | "voided";

const COI_STATUSES: CoiStatus[] = ["pending", "active", "expired", "voided"];

export class CoiUploadDto {
  @IsString()
  campgroundId!: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsIn(COI_STATUSES)
  status?: CoiStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
