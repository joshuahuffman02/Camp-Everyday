import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class ConfirmPaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  reservationId!: string;

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;
}
