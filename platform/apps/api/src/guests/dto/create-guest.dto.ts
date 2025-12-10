import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGuestDto {
  @IsString()
  @IsNotEmpty()
  primaryFirstName!: string;

  @IsString()
  @IsNotEmpty()
  primaryLastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  preferredContact?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  rigType?: string;

  @IsOptional()
  @IsString()
  rigLength?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  vehicleState?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  vip?: boolean;

  @IsOptional()
  @IsString()
  leadSource?: string;

  @IsOptional()
  marketingOptIn?: boolean;

  @IsOptional()
  repeatStays?: number;
}
