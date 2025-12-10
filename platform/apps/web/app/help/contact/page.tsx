"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CheckCircle, Clock, History, Mail, MessageCircle, Phone, Send } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    campground: "",
    role: "Manager",
    topic: "Support request",
    urgency: "Normal",
    details: ""
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const generatedId = `TCK-${Math.floor(Math.random() * 90000 + 10000)}`;
    setTicketId(generatedId);
    setSubmitted(true);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Help", href: "/help" },
            { label: "Contact Support" }
          ]}
        />

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Contact Support</h1>
              <p className="text-slate-600">
                Tell us what you need. We reply fastest to urgent operations issues.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-semibold">
              Avg response: <span className="text-emerald-800">under 1 hour</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-4 w-4 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Submit a support ticket</h2>
            </div>

            {submitted ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  Ticket received
                </div>
                <p className="text-sm text-emerald-900 mt-2">
                  Your request <span className="font-mono font-semibold">{ticketId}</span> is in the queue.
                  We&apos;ll follow up by email. Add any screenshots by replying to the confirmation email.
                </p>
              </div>
            ) : null}

            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Campground</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formState.campground}
                    onChange={(e) => setFormState({ ...formState, campground: e.target.value })}
                    placeholder="North Woods RV"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                  >
                    <option>Owner</option>
                    <option>Manager</option>
                    <option>Front desk</option>
                    <option>Maintenance</option>
                    <option>Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formState.urgency}
                    onChange={(e) => setFormState({ ...formState, urgency: e.target.value })}
                  >
                    <option>Normal</option>
                    <option>High - Guests waiting</option>
                    <option>Critical - Outage</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formState.topic}
                    onChange={(e) => setFormState({ ...formState, topic: e.target.value })}
                  >
                    <option>Support request</option>
                    <option>Billing question</option>
                    <option>Feature request</option>
                    <option>Training / onboarding</option>
                    <option>Bug report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Related area</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Reservations & check-in</option>
                    <option>Payments & refunds</option>
                    <option>Reports & exports</option>
                    <option>Integrations</option>
                    <option>Account / login</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Details</label>
                <textarea
                  required
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="What happened? Include reservation IDs, timestamps, or error messages."
                  value={formState.details}
                  onChange={(e) => setFormState({ ...formState, details: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Attaching screenshots? Reply to the confirmation email after submitting.</p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Submit ticket
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Response targets</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Critical (system down): under 15 minutes</li>
                <li>• Urgent (guests waiting): under 30 minutes</li>
                <li>• Normal: same business day</li>
              </ul>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Self-serve first aid</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <Link href="/help/faq" className="block text-emerald-600 hover:text-emerald-700 font-semibold">FAQ & troubleshooting →</Link>
                <Link href="/help/tutorials" className="block text-emerald-600 hover:text-emerald-700 font-semibold">Video library →</Link>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-900">Other ways to reach us</span>
              </div>
              <div className="text-sm text-slate-700">
                Email: <span className="font-medium">support@campreserv.com</span><br />
                Phone (24/7 critical): <span className="font-medium">(555) 123-0199</span>
              </div>
              <div className="text-xs text-slate-500">
                For feature requests, add details under &quot;Feature request&quot; and we&apos;ll route it to product.
              </div>
              <Link
                href="/help/changelog"
                className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                <History className="h-4 w-4" />
                Check what changed recently
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
