import { IsInt, Min } from "class-validator";

export class RecordPaymentDto {
  @IsInt()
  @Min(1)
  amountCents!: number;
}
