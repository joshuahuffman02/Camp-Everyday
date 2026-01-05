import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Variants | Keepr",
  description: "Design variant test pages for homepage comparison",
  robots: "noindex, nofollow", // Don't index these test pages
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Floating navigation bar for switching between variants */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl rounded-full px-2 py-2 shadow-2xl shadow-black/30 border border-white/10 flex items-center gap-2">
        <span className="text-white/60 text-sm font-medium px-4">Design Variants:</span>
        <a
          href="/design/v-refined"
          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          Refined
        </a>
        <a
          href="/design/v-warm"
          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          Warm
        </a>
        <a
          href="/design/v-bold"
          className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          Bold
        </a>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <a
          href="/"
          className="px-4 py-2 text-sm font-medium text-keepr-clay hover:bg-keepr-clay/20 rounded-full transition-colors"
        >
          Current
        </a>
      </div>
      {children}
    </>
  );
}
