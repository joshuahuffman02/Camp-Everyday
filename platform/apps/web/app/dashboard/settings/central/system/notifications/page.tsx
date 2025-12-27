"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
        <p className="text-slate-500 mt-1">
          Configure automated notification triggers
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Notification Triggers</h3>
              <p className="text-sm text-slate-500 mt-1">
                Set up automated notifications for booking events, payment reminders,
                check-in instructions, and more.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/dashboard/settings/notification-triggers">
                    Configure Notifications
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
