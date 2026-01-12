import { IsArray, IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { IncidentType, Severity, type Prisma } from "@prisma/client";

export class CreateIncidentDto {
  @IsString()
  campgroundId!: string;

  @IsOptional()
  @IsString()
  reservationId?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsString()
  type!: IncidentType;

  @IsOptional()
  @IsString()
  severity?: Severity;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  witnesses?: Prisma.InputJsonValue;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
