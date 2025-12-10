import { IsInt, IsOptional, IsPositive, IsString } from "class-validator";

export class OpenTillDto {
  @IsOptional()
  @IsString()
  terminalId?: string;

  @IsInt()
  @IsPositive()
  openingFloatCents!: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseTillDto {
  @IsInt()
  @IsPositive()
  countedCloseCents!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TillMovementDto {
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ListTillsDto {
  @IsOptional()
  @IsString()
  status?: string;
}
