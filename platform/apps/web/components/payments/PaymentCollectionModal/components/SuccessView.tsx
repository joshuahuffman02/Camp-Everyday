"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../../ui/button";
import {
  Check,
  Receipt,
  Mail,
  Printer,
  Download,
  CreditCard,
  Banknote,
  Wallet,
  Gift,
  Home,
  Building,
  Smartphone,
  FileText,
  Lock,
  LogIn,
  LogOut,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { PaymentMethodType, PAYMENT_METHOD_INFO, TenderEntry, PaymentResult } from "../context/types";
import { cn } from "../../../../lib/utils";
// import { apiClient } from "../../../../lib/api-client"; // TODO: Enable when email API is implemented

interface SuccessViewProps {
  onDone: (result: PaymentResult) => void;
  onCheckInOut?: () => void;
  checkInOutLabel?: string; // "Check In" or "Check Out"
  onPrintReceipt?: () => void;
}

export function SuccessView({
  onDone,
  onCheckInOut,
  checkInOutLabel,
  onPrintReceipt,
}: SuccessViewProps) {
  const { state, props } = usePaymentContext();
  const {
    tenderEntries,
    appliedDiscounts,
    charityDonation,
    originalAmountCents,
    discountCents,
    totalDueCents,
  } = state;

  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Build the payment result for callbacks
  const buildPaymentResult = (): PaymentResult => ({
    success: true,
    totalPaidCents: totalPaid,
    payments: completedEntries.map((t) => ({
      method: t.method,
      amountCents: t.amountCents,
      paymentId: t.reference,
    })),
    appliedDiscounts,
    charityDonation: charityDonation.optedIn ? charityDonation : undefined,
  });

  const completedEntries = tenderEntries.filter((e) => e.status === "completed");
  const totalPaid = completedEntries.reduce((sum, e) => sum + e.amountCents, 0);

  // Auto-send email receipt when component mounts (if guest email available)
  // Note: Email functionality will be enabled once the API endpoint is implemented
  useEffect(() => {
    const sendEmailReceipt = async () => {
      if (!props.guestEmail || !props.campgroundId || emailSent || emailSending) return;

      // Get the reservation ID from subject if available
      const reservationId = props.subject?.type === "reservation" || props.subject?.type === "balance"
        ? props.subject.reservationId
        : undefined;

      if (!reservationId) return;

      setEmailSending(true);
      try {
        // TODO: Enable when API endpoint is implemented
        // await apiClient.emailPaymentReceipt(props.campgroundId, reservationId, {
        //   email: props.guestEmail,
        //   payments: completedEntries.map((t) => ({
        //     method: t.method,
        //     amountCents: t.amountCents,
        //     reference: t.reference,
        //   })),
        //   totalPaidCents: totalPaid,
        // });
        // setEmailSent(true);

        // For now, just simulate success after a brief delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setEmailSent(true);
      } catch (err) {
        console.error("Failed to send receipt email:", err);
        // Don't show error - email is best effort
      } finally {
        setEmailSending(false);
      }
    };

    sendEmailReceipt();
  }, [props.guestEmail, props.campgroundId, props.subject, emailSent, emailSending]);

  const handleDone = () => {
    onDone(buildPaymentResult());
  };

  const handleCheckInOut = () => {
    if (onCheckInOut) {
      onCheckInOut();
    }
    onDone(buildPaymentResult());
  };

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      {/* Success Icon */}
      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="h-10 w-10 text-emerald-600" strokeWidth={3} />
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Payment Complete!</h2>
        <p className="mt-1 text-slate-600">
          Thank you for your payment
        </p>
      </div>

      {/* Email sent indicator */}
      {emailSending && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending receipt to {props.guestEmail}...
        </div>
      )}
      {emailSent && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          Receipt sent to {props.guestEmail}
        </div>
      )}

      {/* Payment Summary */}
      <div className="w-full max-w-sm space-y-4">
        {/* Payment Breakdown */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          {/* Original amount */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="text-slate-900">
              ${(originalAmountCents / 100).toFixed(2)}
            </span>
          </div>

          {/* Discounts */}
          {appliedDiscounts.length > 0 && (
            <>
              {appliedDiscounts.map((discount, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-emerald-600">
                    {discount.code || discount.description}
                  </span>
                  <span className="text-emerald-600">
                    -${(discount.discountCents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Charity donation */}
          {charityDonation.optedIn && charityDonation.amountCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-pink-600">
                Donation to {charityDonation.charityName || "charity"}
              </span>
              <span className="text-pink-600">
                +${(charityDonation.amountCents / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between font-medium">
              <span className="text-slate-900">Total Paid</span>
              <span className="text-emerald-600 text-lg">
                ${(totalPaid / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Used */}
        {completedEntries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">
              Payment{completedEntries.length > 1 ? "s" : ""} received via:
            </h3>
            <div className="space-y-2">
              {completedEntries.map((entry) => (
                <PaymentMethodRow key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        {/* Print receipt */}
        {onPrintReceipt && (
          <Button
            variant="outline"
            onClick={onPrintReceipt}
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        )}

        {/* Check In/Out button (if applicable) */}
        {onCheckInOut && checkInOutLabel && (
          <Button
            onClick={handleCheckInOut}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {checkInOutLabel === "Check In" ? (
              <LogIn className="h-4 w-4 mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            {checkInOutLabel}
          </Button>
        )}

        {/* Done/Close button */}
        <Button
          variant={onCheckInOut ? "outline" : "default"}
          onClick={handleDone}
          className={cn(
            "w-full",
            !onCheckInOut && "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {onCheckInOut ? "Close" : "Done"}
        </Button>
      </div>

      {/* Transaction reference */}
      {completedEntries.length > 0 && completedEntries[0].reference && (
        <p className="text-xs text-slate-400 font-mono">
          Ref: {completedEntries[0].reference}
        </p>
      )}
    </div>
  );
}

interface PaymentMethodRowProps {
  entry: TenderEntry;
}

function PaymentMethodRow({ entry }: PaymentMethodRowProps) {
  const methodInfo = PAYMENT_METHOD_INFO[entry.method];
  const Icon = getMethodIcon(entry.method);

  return (
    <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <span className="text-sm text-slate-700">{methodInfo.label}</span>
      </div>
      <span className="text-sm font-medium text-slate-900">
        ${(entry.amountCents / 100).toFixed(2)}
      </span>
    </div>
  );
}

function getMethodIcon(method: PaymentMethodType) {
  switch (method) {
    case "card":
    case "saved_card":
    case "terminal":
      return CreditCard;
    case "apple_pay":
    case "google_pay":
    case "link":
      return Smartphone;
    case "cash":
      return Banknote;
    case "check":
      return FileText;
    case "guest_wallet":
      return Wallet;
    case "gift_card":
      return Gift;
    case "folio":
      return Home;
    case "ach":
      return Building;
    case "deposit_hold":
      return Lock;
    case "external_pos":
      return Receipt;
    default:
      return CreditCard;
  }
}

/**
 * Compact success indicator for inline confirmation
 */
export function SuccessIndicator({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-emerald-600">
      <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="h-3 w-3" />
      </div>
      <span className="text-sm font-medium">
        {message || "Payment successful"}
      </span>
    </div>
  );
}
