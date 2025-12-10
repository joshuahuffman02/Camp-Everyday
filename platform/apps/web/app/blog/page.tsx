import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Camp Everyday",
  description: "Camping tips, destination guides, and industry insights from Camp Everyday.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Camp Everyday Blog
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tips, guides, and stories from the camping community.
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Coming Soon</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            We&apos;re working on amazing content for you! Our blog will feature camping tips, 
            destination guides, and insights from campground owners.
          </p>
          
          {/* Subscribe Form */}
          <div className="max-w-md mx-auto">
            <p className="text-sm text-slate-500 mb-4">Get notified when we launch:</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
              >
                Notify Me
              </button>
            </form>
          </div>
        </div>

        {/* Preview Categories */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 text-center">Topics We&apos;ll Cover</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <span className="text-2xl mb-2 block">⛺</span>
              <span className="font-medium text-slate-900">Camping Tips</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <span className="text-2xl mb-2 block">🗺️</span>
              <span className="font-medium text-slate-900">Destination Guides</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <span className="text-2xl mb-2 block">🚐</span>
              <span className="font-medium text-slate-900">RV Life</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <span className="text-2xl mb-2 block">👨‍👩‍👧‍👦</span>
              <span className="font-medium text-slate-900">Family Camping</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <span className="text-2xl mb-2 block">🏕️</span>
              <span className="font-medium text-slate-900">Owner Stories</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <span className="text-2xl mb-2 block">🔧</span>
              <span className="font-medium text-slate-900">Gear Reviews</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">In the meantime, start planning your next adventure:</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Find Campgrounds
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
