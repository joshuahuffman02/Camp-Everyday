"use client";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

type CartItem = {
    id: string;
    name: string;
    priceCents: number;
    qty: number;
};

interface CartSidebarProps {
    cart: CartItem[];
    onUpdateQty: (id: string, delta: number) => void;
    onClear: () => void;
    onCheckout: () => void;
}

export function CartSidebar({ cart, onUpdateQty, onClear, onCheckout }: CartSidebarProps) {
    const totalCents = cart.reduce((sum, item) => sum + item.priceCents * item.qty, 0);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-semibold text-slate-900">Current Order</h2>
                {cart.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <p className="text-sm">Cart is empty</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 truncate">{item.name}</div>
                                <div className="text-sm text-slate-500">${(item.priceCents / 100).toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-3 bg-white rounded-md border border-slate-200 px-2 py-1 shadow-sm">
                                <button
                                    onClick={() => onUpdateQty(item.id, -1)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                                >
                                    -
                                </button>
                                <span className="w-4 text-center font-medium text-sm">{item.qty}</span>
                                <button
                                    onClick={() => onUpdateQty(item.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>${(totalCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span>${(totalCents / 100).toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg"
                    size="lg"
                    disabled={cart.length === 0}
                    onClick={onCheckout}
                >
                    Checkout ${(totalCents / 100).toFixed(2)}
                </Button>
            </div>
        </div>
    );
}
