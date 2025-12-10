import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { MaintenancePriorityValues, MaintenanceStatusValues } from "./create-maintenance.dto";

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsString()
  campgroundId?: string;

  @IsOptional()
  @IsString()
  siteId?: string | null;

  @IsOptional()
  @IsString()
  title?: string;

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
