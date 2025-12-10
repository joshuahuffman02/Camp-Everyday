"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Star, ArrowLeft, Gift, Trophy, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type LoyaltyProfile = {
    id: string;
    guestId: string;
    pointsBalance: number;
    tier: string;
    transactions: Array<{
        id: string;
        amount: number;
        reason: string;
        createdAt: string;
    }>;
};

const TIER_COLORS: Record<string, string> = {
    Bronze: "bg-amber-600",
    Silver: "bg-slate-400",
    Gold: "bg-yellow-500",
    Platinum: "bg-gradient-to-r from-slate-300 to-slate-500"
};

const TIER_THRESHOLDS = [
    { name: "Bronze", min: 0, max: 999 },
    { name: "Silver", min: 1000, max: 4999 },
    { name: "Gold", min: 5000, max: 9999 },
    { name: "Platinum", min: 10000, max: Infinity }
];

export default function RewardsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [guestId, setGuestId] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("campreserv:guestToken");
        if (!storedToken) {
            router.push("/portal/login");
            return;
        }

        const fetchData = async () => {
            try {
                const guestData = await apiClient.getGuestMe(storedToken);
                setGuestId(guestData.id);

                const loyaltyProfile = await apiClient.getLoyaltyProfile(guestData.id);
                setProfile(loyaltyProfile);
            } catch (err) {
                console.error(err);
                // Profile may not exist yet, show empty state
                setProfile({
                    id: "",
                    guestId: guestId || "",
                    pointsBalance: 0,
                    tier: "Bronze",
                    transactions: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router, guestId]);

    const handleLogout = () => {
        localStorage.removeItem("campreserv:guestToken");
        router.push("/portal/login");
    };

    const getCurrentTier = () => {
        if (!profile) return TIER_THRESHOLDS[0];
        return TIER_THRESHOLDS.find(t => profile.pointsBalance >= t.min && profile.pointsBalance <= t.max) || TIER_THRESHOLDS[0];
    };

    const getNextTier = () => {
        const current = getCurrentTier();
        const idx = TIER_THRESHOLDS.findIndex(t => t.name === current.name);
        return idx < TIER_THRESHOLDS.length - 1 ? TIER_THRESHOLDS[idx + 1] : null;
    };

    const getProgressToNextTier = () => {
        if (!profile) return 0;
        const nextTier = getNextTier();
        if (!nextTier) return 100;
        const current = getCurrentTier();
        const progress = ((profile.pointsBalance - current.min) / (nextTier.min - current.min)) * 100;
        return Math.min(100, Math.max(0, progress));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/portal/my-stay")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="font-bold text-xl">Rewards</h1>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Points Balance Card */}
                <Card className="overflow-hidden">
                    <div className={`${TIER_COLORS[profile?.tier || "Bronze"]} p-6 text-white`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Your Tier</p>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-6 w-6" />
                                    <span className="text-2xl font-bold">{profile?.tier || "Bronze"}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm opacity-80 mb-1">Points Balance</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <Star className="h-6 w-6" />
                                    <span className="text-3xl font-bold">{profile?.pointsBalance.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        {getNextTier() && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progress to {getNextTier()?.name}</span>
                                    <span className="font-medium">{getNextTier()!.min - (profile?.pointsBalance || 0)} points to go</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${getProgressToNextTier()}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {!getNextTier() && (
                            <div className="flex items-center gap-2 text-green-600">
                                <Gift className="h-5 w-5" />
                                <span className="font-medium">You've reached the highest tier!</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* How to Earn Points */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            How to Earn Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                Earn 1 point for every $1 spent on reservations
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-primary" />
                                Points are credited after check-out
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Points History</CardTitle>
                        <CardDescription>Your recent points activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {profile?.transactions && profile.transactions.length > 0 ? (
                            <div className="space-y-4">
                                {profile.transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                        <div>
                                            <p className="font-medium">{tx.reason}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(tx.createdAt), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <Badge variant={tx.amount > 0 ? "default" : "destructive"}>
                                            {tx.amount > 0 ? "+" : ""}{tx.amount} pts
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                No points activity yet. Complete a stay to start earning!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
