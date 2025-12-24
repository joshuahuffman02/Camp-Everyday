import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GuestWalletService } from "./guest-wallet.service";
import {
  AddWalletCreditDto,
  DebitWalletDto,
  WalletTransactionsQueryDto,
} from "./guest-wallet.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class GuestWalletController {
  constructor(private readonly guestWalletService: GuestWalletService) {}

  /**
   * Get guest's wallet balance at a campground
   */
  @Get("campgrounds/:campgroundId/guests/:guestId/wallet")
  async getWalletBalance(
    @Param("campgroundId") campgroundId: string,
    @Param("guestId") guestId: string
  ) {
    return this.guestWalletService.getGuestBalance(campgroundId, guestId);
  }

  /**
   * Add credit to guest's wallet
   */
  @Post("campgrounds/:campgroundId/guests/:guestId/wallet/credit")
  async addCredit(
    @Param("campgroundId") campgroundId: string,
    @Param("guestId") guestId: string,
    @Body() dto: Omit<AddWalletCreditDto, "guestId">,
    @Request() req: any
  ) {
    return this.guestWalletService.addCredit(
      campgroundId,
      { ...dto, guestId },
      undefined,
      req.user
    );
  }

  /**
   * Get wallet transaction history
   */
  @Get("campgrounds/:campgroundId/guests/:guestId/wallet/transactions")
  async getTransactions(
    @Param("campgroundId") campgroundId: string,
    @Param("guestId") guestId: string,
    @Query() query: WalletTransactionsQueryDto
  ) {
    const wallet = await this.guestWalletService.findWallet(campgroundId, guestId);
    if (!wallet) {
      return { transactions: [], total: 0 };
    }

    return this.guestWalletService.listTransactions(
      wallet.id,
      query.limit ?? 50,
      query.offset ?? 0
    );
  }

  /**
   * Use wallet to pay for something (internal endpoint for POS/reservations)
   */
  @Post("campgrounds/:campgroundId/wallet/debit")
  async debitWallet(
    @Param("campgroundId") campgroundId: string,
    @Body() dto: DebitWalletDto,
    @Request() req: any
  ) {
    return this.guestWalletService.debitForPayment(
      campgroundId,
      dto,
      undefined,
      req.user
    );
  }

  /**
   * Credit wallet from reservation refund
   */
  @Post("campgrounds/:campgroundId/wallet/credit-from-refund")
  async creditFromRefund(
    @Param("campgroundId") campgroundId: string,
    @Body()
    dto: {
      reservationId: string;
      guestId: string;
      amountCents: number;
      reason: string;
    },
    @Request() req: any
  ) {
    return this.guestWalletService.creditFromRefund(
      campgroundId,
      dto.reservationId,
      dto.guestId,
      dto.amountCents,
      dto.reason,
      undefined,
      req.user
    );
  }
}
