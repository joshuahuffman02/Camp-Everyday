import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export type MaintenanceStatusValue = "open" | "in_progress" | "closed";
export type MaintenancePriorityValue = "low" | "medium" | "high";

export const MaintenanceStatusValues: MaintenanceStatusValue[] = ["open", "in_progress", "closed"];
export const MaintenancePriorityValues: MaintenancePriorityValue[] = ["low", "medium", "high"];

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
  status?: MaintenanceStatusValue;

  @IsOptional()
  @IsEnum(MaintenancePriorityValues)
  priority?: MaintenancePriorityValue;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
