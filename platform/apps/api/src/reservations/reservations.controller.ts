import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";
import { RefundPaymentDto } from "./dto/refund-payment.dto";
import { QuoteReservationDto } from "./dto/quote-reservation.dto";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller()
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) { }

  @Get("campgrounds/:campgroundId/reservations")
  list(@Param("campgroundId") campgroundId: string) {
    return this.reservations.listByCampground(campgroundId);
  }

  @Get("campgrounds/:campgroundId/availability")
  availability(
    @Param("campgroundId") campgroundId: string,
    @Query("arrivalDate") arrivalDate: string,
    @Query("departureDate") departureDate: string,
    @Query("rigType") rigType?: string,
    @Query("rigLength") rigLength?: string
  ) {
    return this.reservations.searchAvailability(campgroundId, arrivalDate, departureDate, rigType, rigLength);
  }

  @Get("campgrounds/:campgroundId/sites/status")
  sitesWithStatus(
    @Param("campgroundId") campgroundId: string,
    @Query("arrivalDate") arrivalDate?: string,
    @Query("departureDate") departureDate?: string
  ) {
    return this.reservations.getSitesWithStatus(campgroundId, arrivalDate, departureDate);
  }

  @Get("campgrounds/:campgroundId/reservations/overlaps")
  overlaps(@Param("campgroundId") campgroundId: string) {
    return this.reservations.listOverlaps(campgroundId);
  }

  @Get("campgrounds/:campgroundId/reservations/overlap-check")
  overlapCheck(
    @Param("campgroundId") campgroundId: string,
    @Query("siteId") siteId: string,
    @Query("arrivalDate") arrivalDate: string,
    @Query("departureDate") departureDate: string,
    @Query("ignoreId") ignoreId?: string
  ) {
    return this.reservations.overlapCheck(campgroundId, siteId, arrivalDate, departureDate, ignoreId);
  }

  @Get("reservations/:id")
  getById(@Param("id") id: string) {
    return this.reservations.findOne(id);
  }

  @Get("reservations/:id/calculate-deposit")
  calculateDeposit(@Param("id") id: string) {
    return this.reservations.calculateDeposit(id);
  }

  @Post("reservations")
  create(@Body() body: CreateReservationDto) {
    return this.reservations.create(body);
  }

  @Patch("reservations/:id")
  update(@Param("id") id: string, @Body() body: Partial<CreateReservationDto>) {
    return this.reservations.update(id, body);
  }

  @Patch("reservations/:id/group")
  updateGroup(
    @Param("id") id: string,
    @Body() body: { groupId: string | null; role?: "primary" | "member" | null }
  ) {
    return this.reservations.updateGroupAssignment(id, body);
  }

  @Post("campgrounds/:campgroundId/quote")
  quote(@Param("campgroundId") campgroundId: string, @Body() body: QuoteReservationDto) {
    return this.reservations.quote(campgroundId, body.siteId, body.arrivalDate, body.departureDate);
  }

  @Get("campgrounds/:campgroundId/aging")
  aging(@Param("campgroundId") campgroundId: string) {
    return this.reservations.agingBuckets(campgroundId);
  }

  @Post("reservations/:id/payments")
  pay(@Param("id") id: string, @Body() body: RecordPaymentDto) {
    return this.reservations.recordPayment(id, body.amountCents);
  }

  @Post("reservations/:id/refunds")
  refund(@Param("id") id: string, @Body() body: RefundPaymentDto) {
    return this.reservations.refundPayment(id, body.amountCents);
  }

  @Delete("reservations/:id")
  remove(@Param("id") id: string) {
    return this.reservations.remove(id);
  }

  @Post("reservations/:id/kiosk-checkin")
  kioskCheckIn(@Param("id") id: string, @Body() body: { upsellTotalCents: number }) {
    return this.reservations.kioskCheckIn(id, body.upsellTotalCents || 0);
  }

  @Get("campgrounds/:campgroundId/matches")
  getMatches(
    @Param("campgroundId") campgroundId: string,
    @Query("guestId") guestId: string
  ) {
    return this.reservations.getMatchedSites(campgroundId, guestId);
  }
}
