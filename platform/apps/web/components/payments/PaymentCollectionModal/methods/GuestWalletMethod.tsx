"use client";

import React, { useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Loader2, Wallet2, AlertCircle } from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { apiClient } from "../../../../lib/api-client";
import { cn } from "../../../../lib/utils";

interface GuestWalletMethodProps {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function GuestWalletMethod({ onSuccess, onError, onCancel }: GuestWalletMethodProps) {
  const { state, actions, props } = usePaymentContext();
  const { walletBalanceCents, remainingCents } = state;

  const [amountToUse, setAmountToUse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletBalance = walletBalanceCents / 100;
  const amountDue = remainingCents / 100;

  // Default to using full balance or amount due, whichever is less
  const maxUsable = Math.min(walletBalanceCents, remainingCents);
  const amountToDebit = amountToUse
    ? Math.min(parseFloat(amountToUse) * 100, maxUsable)
    : maxUsable;
  const amountToDebitDollars = amountToDebit / 100;

  const canComplete = amountToDebit > 0 && amountToDebit <= walletBalanceCents;

  const handleUseAll = () => {
    setAmountToUse((maxUsable / 100).toFixed(2));
  };

  const handleCancel = () => {
    actions.selectMethod(null);
    onCancel?.();
  };

  const handleComplete = async () => {
    if (!canComplete) {
      setError("Invalid amount");
      return;
    }

    if (!props.guestId) {
      setError("Guest ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Debit from guest wallet
      const result = await apiClient.debitGuestWallet(props.campgroundId, props.guestId, {
        amountCents: Math.round(amountToDebit),
        description: `Payment for ${props.subject.type}`,
        reservationId:
          props.subject.type === "reservation" || props.subject.type === "balance"
            ? props.subject.reservationId
            : undefined,
      });

      // Generate reference
      const reference = `WALLET-${result.transactionId || Date.now()}`;

      // Add tender entry
      actions.addTenderEntry({
        method: "guest_wallet",
        amountCents: Math.round(amountToDebit),
        reference,
        metadata: {
          transactionId: result.transactionId,
          newBalance: result.newBalanceCents,
        },
      });

      onSuccess?.(reference);
    } catch (err: any) {
      setError(err.message || "Failed to debit wallet");
      onError?.(err.message || "Failed to debit wallet");
    } finally {
      setLoading(false);
    }
  };

  // No wallet balance
  if (walletBalanceCents <= 0) {
    return (
      <div className="py-8 text-center space-y-4">
        <Wallet2 className="h-12 w-12 mx-auto text-slate-300" />
        <p className="text-slate-600">No wallet balance available</p>
        <p className="text-sm text-slate-500">
          This guest does not have any stored credit to use
        </p>
        <Button variant="outline" onClick={handleCancel}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet balance display */}
      <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-sm text-emerald-600">Available Wallet Balance</p>
        <p className="text-3xl font-bold text-emerald-700">${walletBalance.toFixed(2)}</p>
      </div>

      {/* Amount due */}
      <div className="text-center p-3 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-500">Amount Due</p>
        <p className="text-xl font-semibold text-slate-900">${amountDue.toFixed(2)}</p>
      </div>

      {/* Amount to use */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="wallet-amount" className="text-sm text-slate-600">
            Amount to Use
          </Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleUseAll}
            className="h-auto p-0 text-emerald-600"
          >
            Use Maximum (${(maxUsable / 100).toFixed(2)})
          </Button>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <Input
            id="wallet-amount"
            type="number"
            step="0.01"
            min="0"
            max={maxUsable / 100}
            value={amountToUse || (maxUsable / 100).toFixed(2)}
            onChange={(e) => setAmountToUse(e.target.value)}
            className="pl-7 text-lg font-medium"
          />
        </div>
      </div>

      {/* Remaining after wallet */}
      {amountToDebit < remainingCents && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-medium">
              ${((remainingCents - amountToDebit) / 100).toFixed(2)}
            </span>{" "}
            will remain after using wallet balance
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete || loading}
          className="min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wallet2 className="h-4 w-4 mr-2" />
              Use ${amountToDebitDollars.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default GuestWalletMethod;
