import { IsString, IsInt, IsPositive, IsOptional, IsIn, Min } from "class-validator";
import { Type } from "class-transformer";

export class AddWalletCreditDto {
  @IsString()
  guestId!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class DebitWalletDto {
  @IsString()
  guestId!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @IsString()
  referenceType!: string;

  @IsString()
  referenceId!: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class TransferToWalletDto {
  @IsString()
  guestId!: string;

  @IsString()
  reservationId!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class WalletTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export interface WalletBalance {
  walletId: string;
  guestId: string;
  campgroundId: string;
  balanceCents: number;
  availableCents: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  direction: string;
  amountCents: number;
  beforeBalanceCents: number;
  afterBalanceCents: number;
  referenceType: string;
  referenceId: string;
  reason: string | null;
  createdAt: Date;
}

export interface WalletCreditResult {
  walletId: string;
  balanceCents: number;
  transactionId: string;
}

export interface WalletDebitResult {
  walletId: string;
  balanceCents: number;
  transactionId: string;
}
