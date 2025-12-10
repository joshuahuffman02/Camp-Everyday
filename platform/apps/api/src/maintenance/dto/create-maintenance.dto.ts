import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export const MaintenanceStatusValues = ["open", "in_progress", "closed"] as const;
export const MaintenancePriorityValues = ["low", "medium", "high"] as const;

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  campgroundId!: string;

  @IsOptional()
  @IsString()
  siteId?: string | null;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatusValues)
  status?: (typeof MaintenanceStatusValues)[number];

  @IsOptional()
  @IsEnum(MaintenancePriorityValues)
  priority?: (typeof MaintenancePriorityValues)[number];

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
