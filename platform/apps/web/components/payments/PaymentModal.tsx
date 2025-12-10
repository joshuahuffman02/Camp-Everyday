"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { apiClient } from "../../lib/api-client";

// Initialize Stripe outside of component to avoid recreating object on renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservationId: string;
    amountCents: number;
    onSuccess: () => void;
}

function CheckoutForm({ amountCents, onSuccess, onClose }: { amountCents: number; onSuccess: () => void; onClose: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || "An error occurred");
            setProcessing(false);
            return;
        }

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret: (elements as any)._commonOptions.clientSecret, // Hacky access to secret, or passed via options
            confirmParams: {
                return_url: window.location.href, // In a real app, this might be a specific success page
            },
            redirect: "if_required",
        });

        if (confirmError) {
            setError(confirmError.message || "Payment failed");
            setProcessing(false);
        } else {
            // Payment succeeded
            onSuccess();
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={onClose} disabled={processing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!stripe || processing}>
                    {processing ? "Processing..." : `Pay $${(amountCents / 100).toFixed(2)}`}
                </Button>
            </div>
        </form>
    );
}

export function PaymentModal({ isOpen, onClose, reservationId, amountCents, onSuccess }: PaymentModalProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && reservationId && amountCents > 0) {
            // Create PaymentIntent
            apiClient.createPaymentIntent(amountCents, "usd", reservationId)
                .then((data) => setClientSecret(data.clientSecret))
                .catch((err) => console.error("Failed to create payment intent", err));
        }
    }, [isOpen, reservationId, amountCents]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pay Balance</DialogTitle>
                </DialogHeader>
                {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm amountCents={amountCents} onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                )}
                {!clientSecret && isOpen && (
                    <div className="py-8 text-center text-slate-500">Initializing payment...</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
