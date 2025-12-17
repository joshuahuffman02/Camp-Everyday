"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
    { label: "Campgrounds", href: "/campgrounds" },
    { label: "Book a stay", href: "/booking" },
    { label: "Help", href: "/help" }
];

export function PublicHeader() {
    const { data: session, status } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);
    const isLoading = status === "loading";

    const closeMobile = () => setMobileOpen(false);

    const authButtons = (
        <>
            {isLoading ? (
                <div className="w-24 h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : session ? (
                <>
                    <span className="text-sm text-slate-600 hidden sm:inline">
                        Welcome, {session.user?.name?.split(" ")[0] || "Guest"}
                    </span>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    >
                        Dashboard
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Sign Out
                    </button>
                </>
            ) : (
                <>
                    <Link
                        href="/auth/signin"
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    >
                        Start Free Trial
                    </Link>
                </>
            )}
        </>
    );

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group min-w-0">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 transition-transform group-hover:scale-105">
                        <Image
                            src="/logo.png"
                            alt="Camp Everyday"
                            fill
                            sizes="48px"
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
                        Camp Everyday
                    </span>
                </Link>

                {/* Right side buttons */}
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <div className="hidden md:flex items-center gap-3">{authButtons}</div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white shadow-lg">
                    <nav className="px-4 py-4 space-y-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block rounded-lg px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50"
                                onClick={closeMobile}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-2 space-y-2">
                            <div className="flex flex-col gap-2">{authButtons}</div>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
