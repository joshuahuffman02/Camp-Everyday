"use client";

import { useState, useCallback } from "react";
import { apiClient } from "../../../../lib/api-client";
import { usePaymentContext } from "../context/PaymentContext";

interface GiftCardInfo {
  code: string;
  balanceCents: number;
  expiresAt?: string;
  isActive: boolean;
}

interface UseGiftCardResult {
  giftCard: GiftCardInfo | null;
  loading: boolean;
  error: string | null;
  lookupGiftCard: (code: string) => Promise<GiftCardInfo | null>;
  redeemGiftCard: (code: string, amountCents: number) => Promise<RedeemResult | null>;
  clearGiftCard: () => void;
}

interface RedeemResult {
  success: boolean;
  transactionId: string;
  amountRedeemedCents: number;
  remainingBalanceCents: number;
}

export function useGiftCard(): UseGiftCardResult {
  const { props } = usePaymentContext();

  const [giftCard, setGiftCard] = useState<GiftCardInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupGiftCard = useCallback(
    async (code: string): Promise<GiftCardInfo | null> => {
      if (!code.trim()) {
        setError("Please enter a gift card code");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiClient.lookupGiftCard(props.campgroundId, code.trim().toUpperCase());

        if (!result.isActive) {
          setError("This gift card is inactive or has been deactivated");
          return null;
        }

        if (result.balanceCents <= 0) {
          setError("This gift card has no remaining balance");
          return null;
        }

        if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
          setError("This gift card has expired");
          return null;
        }

        const cardInfo: GiftCardInfo = {
          code: result.code,
          balanceCents: result.balanceCents,
          expiresAt: result.expiresAt,
          isActive: result.isActive,
        };

        setGiftCard(cardInfo);
        return cardInfo;
      } catch (err: any) {
        const message = err.message || "Gift card not found";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [props.campgroundId]
  );

  const redeemGiftCard = useCallback(
    async (code: string, amountCents: number): Promise<RedeemResult | null> => {
      if (!giftCard) {
        setError("Please look up a gift card first");
        return null;
      }

      if (amountCents <= 0) {
        setError("Invalid redemption amount");
        return null;
      }

      if (amountCents > giftCard.balanceCents) {
        setError(`Gift card only has $${(giftCard.balanceCents / 100).toFixed(2)} available`);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiClient.redeemGiftCard(props.campgroundId, {
          code: code.trim().toUpperCase(),
          amountCents,
          reservationId:
            props.subject.type === "reservation" || props.subject.type === "balance"
              ? props.subject.reservationId
              : undefined,
        });

        // Update local gift card state with new balance
        setGiftCard((prev) =>
          prev
            ? {
                ...prev,
                balanceCents: result.remainingBalanceCents,
              }
            : null
        );

        return {
          success: true,
          transactionId: result.transactionId,
          amountRedeemedCents: result.amountRedeemedCents,
          remainingBalanceCents: result.remainingBalanceCents,
        };
      } catch (err: any) {
        setError(err.message || "Failed to redeem gift card");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [props.campgroundId, props.subject, giftCard]
  );

  const clearGiftCard = useCallback(() => {
    setGiftCard(null);
    setError(null);
  }, []);

  return {
    giftCard,
    loading,
    error,
    lookupGiftCard,
    redeemGiftCard,
    clearGiftCard,
  };
}

/**
 * Format gift card code for display (e.g., XXXX-XXXX-XXXX)
 */
export function formatGiftCardCode(code: string): string {
  const cleaned = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const chunks = cleaned.match(/.{1,4}/g) || [];
  return chunks.join("-");
}
