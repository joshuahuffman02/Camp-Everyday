import { IsInt, Min } from "class-validator";

export class RefundPaymentDto {
  @IsInt()
  @Min(1)
  amountCents!: number;
}
