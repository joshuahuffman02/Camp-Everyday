import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class QuoteReservationDto {
  @IsString()
  @IsNotEmpty()
  siteId!: string;

  @IsDateString()
  arrivalDate!: string;

  @IsDateString()
  departureDate!: string;
}
