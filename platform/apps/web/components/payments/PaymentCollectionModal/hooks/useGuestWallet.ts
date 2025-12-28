"use client";

import { useState, useCallback } from "react";
import { apiClient } from "../../../../lib/api-client";
import { usePaymentContext } from "../context/PaymentContext";

interface UseGuestWalletResult {
  balanceCents: number;
  loading: boolean;
  error: string | null;
  debitWallet: (amountCents: number, description?: string) => Promise<DebitResult | null>;
  refreshBalance: () => Promise<void>;
}

interface DebitResult {
  success: boolean;
  transactionId: string;
  newBalanceCents: number;
}

export function useGuestWallet(): UseGuestWalletResult {
  const { state, props } = usePaymentContext();
  const { walletBalanceCents } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debitWallet = useCallback(
    async (amountCents: number, description?: string): Promise<DebitResult | null> => {
      if (!props.guestId) {
        setError("Guest ID is required");
        return null;
      }

      if (amountCents > walletBalanceCents) {
        setError("Insufficient wallet balance");
        return null;
      }

      if (amountCents <= 0) {
        setError("Invalid amount");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiClient.debitGuestWallet(props.campgroundId, props.guestId, {
          amountCents,
          description: description || "Payment",
          reservationId:
            props.subject.type === "reservation" || props.subject.type === "balance"
              ? props.subject.reservationId
              : undefined,
        });

        return {
          success: true,
          transactionId: result.transactionId,
          newBalanceCents: result.newBalanceCents,
        };
      } catch (err: any) {
        setError(err.message || "Failed to debit wallet");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [props.guestId, props.campgroundId, props.subject, walletBalanceCents]
  );

  const refreshBalance = useCallback(async () => {
    if (!props.guestId) return;

    setLoading(true);
    setError(null);

    try {
      // Balance is refreshed via context, this just triggers an error clear
      await apiClient.getGuestWalletBalance(props.campgroundId, props.guestId);
    } catch (err: any) {
      setError(err.message || "Failed to refresh balance");
    } finally {
      setLoading(false);
    }
  }, [props.guestId, props.campgroundId]);

  return {
    balanceCents: walletBalanceCents,
    loading,
    error,
    debitWallet,
    refreshBalance,
  };
}

/**
 * Format wallet balance for display
 */
export function formatWalletBalance(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
