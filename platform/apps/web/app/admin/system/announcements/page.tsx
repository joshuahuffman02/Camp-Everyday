"use client";

import { useState } from "react";
import { Megaphone, Send, Clock, CheckCircle, Users, Plus, X } from "lucide-react";

type Announcement = {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success";
    target: "all" | "admins" | "campground";
    campgroundId?: string;
    status: "draft" | "scheduled" | "sent";
    scheduledAt?: Date;
    sentAt?: Date;
    createdBy: string;
    createdAt: Date;
};

const stubAnnouncements: Announcement[] = [
    {
        id: "1",
        title: "System Maintenance",
        message: "Scheduled maintenance on Dec 15th from 2-4 AM CST. Brief outages expected.",
        type: "warning",
        target: "all",
        status: "sent",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        createdBy: "admin@campeveryday.com",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: "2",
        title: "New Booking Feature",
        message: "We've launched a new streamlined booking flow! Check it out in Settings > Features.",
        type: "success",
        target: "all",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        createdBy: "admin@campeveryday.com",
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
        id: "3",
        title: "Holiday Hours",
        message: "Support hours will be reduced Dec 24-26. Emergency support available.",
        type: "info",
        target: "all",
        status: "draft",
        createdBy: "admin@campeveryday.com",
        createdAt: new Date(),
    },
];

const typeColors = {
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const statusIcons = {
    draft: Clock,
    scheduled: Clock,
    sent: CheckCircle,
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>(stubAnnouncements);
    const [showNew, setShowNew] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        message: "",
        type: "info" as const,
        target: "all" as const,
    });

    const handleCreate = () => {
        const announcement: Announcement = {
            id: Date.now().toString(),
            ...newAnnouncement,
            status: "draft",
            createdBy: "admin@campeveryday.com",
            createdAt: new Date(),
        };
        setAnnouncements([announcement, ...announcements]);
        setNewAnnouncement({ title: "", message: "", type: "info", target: "all" });
        setShowNew(false);
    };

    const sendNow = (id: string) => {
        setAnnouncements((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, status: "sent" as const, sentAt: new Date() } : a
            )
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Platform Announcements</h1>
                    <p className="text-slate-400 mt-1">
                        Broadcast messages to staff across all campgrounds
                    </p>
                </div>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Announcement
                </button>
            </div>

            {/* New Announcement Form */}
            {showNew && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Create Announcement</h2>
                        <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Announcement title"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-slate-400 mb-1">Type</label>
                                <select
                                    value={newAnnouncement.type}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-slate-400 mb-1">Target</label>
                                <select
                                    value={newAnnouncement.target}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Staff</option>
                                    <option value="admins">Admins Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Message</label>
                        <textarea
                            value={newAnnouncement.message}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your announcement message..."
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowNew(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newAnnouncement.title || !newAnnouncement.message}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Create Draft
                        </button>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.map((announcement) => {
                    const StatusIcon = statusIcons[announcement.status];
                    return (
                        <div
                            key={announcement.id}
                            className={`rounded-lg border p-4 ${typeColors[announcement.type]}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Megaphone className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{announcement.title}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded ${announcement.status === "sent" ? "bg-emerald-500/30" :
                                                    announcement.status === "scheduled" ? "bg-blue-500/30" : "bg-slate-500/30"
                                                }`}>
                                                {announcement.status}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1 opacity-90">{announcement.message}</p>
                                        <div className="flex items-center gap-4 text-xs mt-2 opacity-70">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {announcement.target === "all" ? "All Staff" : "Admins Only"}
                                            </span>
                                            <span>by {announcement.createdBy}</span>
                                            {announcement.sentAt && (
                                                <span>Sent {announcement.sentAt.toLocaleDateString()}</span>
                                            )}
                                            {announcement.scheduledAt && announcement.status === "scheduled" && (
                                                <span>Scheduled for {announcement.scheduledAt.toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {announcement.status === "draft" && (
                                    <button
                                        onClick={() => sendNow(announcement.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                                    >
                                        <Send className="h-4 w-4" />
                                        Send Now
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-sm text-slate-500 text-center">
                Announcements are stored locally • Data is stubbed for demo
            </div>
        </div>
    );
}
