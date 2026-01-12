import { IsBoolean, IsOptional, IsInt, IsString, Min, IsIn } from "class-validator";

// Define the enum values directly to avoid Prisma import issues at runtime
export type SetupServiceType =
  | "quick_start"
  | "data_import_500"
  | "data_import_2000"
  | "data_import_5000"
  | "data_import_custom";

const SETUP_SERVICE_TYPES: SetupServiceType[] = [
  "quick_start",
  "data_import_500",
  "data_import_2000",
  "data_import_5000",
  "data_import_custom",
];

export class PurchaseSetupServiceDto {
  @IsIn(SETUP_SERVICE_TYPES)
  serviceType!: SetupServiceType;

  @IsBoolean()
  payUpfront!: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  reservationCount?: number;

  @IsOptional()
  @IsString()
  importNotes?: string;

  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;
}
