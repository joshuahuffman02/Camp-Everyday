declare module "@prisma/client" {
  export enum ReservationStatus {
    pending = "pending",
    confirmed = "confirmed",
    checked_in = "checked_in",
    checked_out = "checked_out",
    cancelled = "cancelled",
  }

  export enum TaxRuleType {
    percentage = "percentage",
    flat = "flat",
    exemption = "exemption",
  }

  export type MembershipType = any;
  export type GuestMembership = any;
  export namespace Prisma {
    export type GuestMembershipGetPayload<T> = any;
  }

  export class PrismaClient {
    [key: string]: any;
  }
}
