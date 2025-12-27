"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Email Templates</h2>
        <p className="text-slate-500 mt-1">
          Customize automated email messages
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Email Template Editor</h3>
              <p className="text-sm text-slate-500 mt-1">
                Customize confirmation emails, reminder messages, check-out emails,
                and other automated communications.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/dashboard/settings/templates">
                    Edit Templates
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
