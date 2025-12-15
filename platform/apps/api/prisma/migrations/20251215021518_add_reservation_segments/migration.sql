-- CreateTable
CREATE TABLE "ReservationSegment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationSegment_reservationId_idx" ON "ReservationSegment"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationSegment_siteId_idx" ON "ReservationSegment"("siteId");

-- CreateIndex
CREATE INDEX "ReservationSegment_startDate_idx" ON "ReservationSegment"("startDate");

-- AddForeignKey
ALTER TABLE "ReservationSegment" ADD CONSTRAINT "ReservationSegment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSegment" ADD CONSTRAINT "ReservationSegment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
