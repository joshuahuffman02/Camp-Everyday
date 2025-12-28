"use client";

import React, { useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Loader2, Home, AlertCircle, Info } from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { apiClient } from "../../../../lib/api-client";

interface FolioMethodProps {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function FolioMethod({ onSuccess, onError, onCancel }: FolioMethodProps) {
  const { state, actions, props } = usePaymentContext();

  const [siteNumber, setSiteNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountDue = state.remainingCents / 100;
  const canComplete = siteNumber.trim().length > 0;

  // If this is for a reservation, we might already know the site
  const isReservationContext =
    props.subject.type === "reservation" || props.subject.type === "balance";

  const handleCancel = () => {
    actions.selectMethod(null);
    onCancel?.();
  };

  const handleComplete = async () => {
    if (!canComplete && !isReservationContext) {
      setError("Please enter a site number or guest name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate reference for folio charge
      const reference = `FOLIO-${siteNumber.trim() || "RES"}-${Date.now()}`;
      const amountCents = state.remainingCents;

      // Get reservation ID from subject if available
      const reservationId = props.subject?.type === "reservation" || props.subject?.type === "balance"
        ? props.subject.reservationId
        : undefined;

      // Record the payment in the database
      if (reservationId) {
        await apiClient.recordReservationPayment(reservationId, amountCents, [
          { method: "folio", amountCents, note: siteNumber.trim() ? `Site ${siteNumber.trim()}` : "Charged to reservation" }
        ]);
      }

      // Add tender entry for UI tracking
      actions.addTenderEntry({
        method: "folio",
        amountCents,
        reference,
        metadata: {
          siteNumber: siteNumber.trim() || undefined,
          chargedToReservation: isReservationContext,
        },
      });

      onSuccess?.(reference);
    } catch (err: any) {
      setError(err.message || "Failed to charge to folio");
      onError?.(err.message || "Failed to charge to folio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Amount display */}
      <div className="text-center p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-500">Charge to Folio</p>
        <p className="text-3xl font-bold text-slate-900">${amountDue.toFixed(2)}</p>
      </div>

      {/* Reservation context info */}
      {isReservationContext && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Charging to Reservation Folio</p>
            <p className="mt-1 text-blue-700">
              This amount will be added to the guest&apos;s reservation balance.
            </p>
          </div>
        </div>
      )}

      {/* Site/Guest lookup */}
      <div className="space-y-2">
        <Label htmlFor="site-number" className="text-sm text-slate-600">
          Site Number or Guest Name
          {!isReservationContext && <span className="text-red-500"> *</span>}
        </Label>
        <Input
          id="site-number"
          value={siteNumber}
          onChange={(e) => setSiteNumber(e.target.value)}
          placeholder="e.g., A12, Cabin 3, Smith"
          className="font-medium"
        />
        <p className="text-xs text-slate-500">
          Enter the site number, cabin name, or guest name to charge this amount to their folio.
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Payment Pending</p>
          <p className="mt-1 text-amber-700">
            This charge will be added to the guest&apos;s folio and will need to be collected
            at checkout.
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={(!canComplete && !isReservationContext) || loading}
          className="min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Charging...
            </>
          ) : (
            <>
              <Home className="h-4 w-4 mr-2" />
              Charge to Folio
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FolioMethod;
