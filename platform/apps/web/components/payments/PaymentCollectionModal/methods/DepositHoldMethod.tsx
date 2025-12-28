"use client";

import React, { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Loader2, Shield, AlertTriangle, Info } from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { apiClient } from "../../../../lib/api-client";
import { cn } from "../../../../lib/utils";

// Get Stripe promise - should be initialized once
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface DepositHoldMethodProps {
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function DepositHoldMethod({
  onSuccess,
  onError,
  onCancel,
}: DepositHoldMethodProps) {
  const { state, props } = usePaymentContext();
  const { remainingCents } = state;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdAmount, setHoldAmount] = useState<string>(
    (remainingCents / 100).toFixed(2)
  );
  const [holdReason, setHoldReason] = useState<string>("Security deposit");

  useEffect(() => {
    createAuthHold();
  }, []);

  const createAuthHold = async () => {
    setLoading(true);
    setError(null);

    try {
      const amountCents = Math.round(parseFloat(holdAmount) * 100);

      if (amountCents <= 0) {
        throw new Error("Invalid hold amount");
      }

      const result = await apiClient.createAuthHold(props.campgroundId, {
        amountCents,
        reason: holdReason,
        reservationId:
          props.subject.type === "reservation" || props.subject.type === "balance"
            ? props.subject.reservationId
            : undefined,
        guestId: props.guestId,
      });

      setClientSecret(result.clientSecret);
    } catch (err: any) {
      setError(err.message || "Failed to create authorization hold");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="mt-2 text-slate-600">Setting up authorization hold...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Failed to create hold</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={createAuthHold} className="flex-1">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Authorization Hold</p>
              <p className="text-sm text-amber-600">
                This will place a temporary hold on the guest's card. The amount
                will not be charged until you capture it.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hold-amount">Hold Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <Input
                id="hold-amount"
                type="number"
                value={holdAmount}
                onChange={(e) => setHoldAmount(e.target.value)}
                min="0.50"
                step="0.01"
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hold-reason">Reason for Hold</Label>
            <Input
              id="hold-reason"
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="e.g., Security deposit, Damage deposit"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={createAuthHold}
            disabled={!holdAmount || parseFloat(holdAmount) <= 0}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#d97706", // amber-600
          },
        },
      }}
    >
      <DepositHoldForm
        holdAmount={holdAmount}
        holdReason={holdReason}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
}

interface DepositHoldFormProps {
  holdAmount: string;
  holdReason: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

function DepositHoldForm({
  holdAmount,
  holdReason,
  onSuccess,
  onError,
  onCancel,
}: DepositHoldFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { actions } = usePaymentContext();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

      if (paymentIntent && paymentIntent.status === "requires_capture") {
        // Authorization successful - hold is in place
        const amountCents = Math.round(parseFloat(holdAmount) * 100);

        actions.addTenderEntry({
          method: "deposit_hold",
          amountCents,
          reference: paymentIntent.id,
          details: {
            reason: holdReason,
            status: "authorized",
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 days
          },
        });

        onSuccess(paymentIntent.id);
      } else {
        throw new Error("Unexpected payment status");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authorize hold");
      onError(err.message || "Failed to authorize hold");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              Authorization Hold: ${holdAmount}
            </p>
            <p className="text-sm text-amber-600">{holdReason}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "never", googlePay: "never" },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            This authorization hold will expire in 7 days if not captured or
            released. You can capture the full amount, a partial amount, or
            release the hold entirely.
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Authorizing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Place Hold
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
