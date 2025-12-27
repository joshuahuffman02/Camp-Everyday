"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Webhook, ExternalLink } from "lucide-react";

export default function WebhooksPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Webhooks</h2>
        <p className="text-slate-500 mt-1">
          Configure webhook endpoints for integrations
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Webhook className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Webhook Endpoints</h3>
              <p className="text-sm text-slate-500 mt-1">
                Set up webhooks to receive real-time notifications when events
                occur. Integrate with external systems and automation tools.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/dashboard/settings/webhooks">
                    Manage Webhooks
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
