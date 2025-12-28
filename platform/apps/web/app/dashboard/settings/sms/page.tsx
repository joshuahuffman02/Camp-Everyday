"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import {
  Phone,
  MessageSquare,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Info
} from "lucide-react";
import Link from "next/link";

export default function SmsSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Get campground from local storage
  const [campgroundId, setCampgroundId] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("campreserv:selectedCampground")
      : null;
    if (stored) setCampgroundId(stored);
  }, []);

  // Fetch existing SMS settings
  const settingsQuery = useQuery({
    queryKey: ["sms-settings", campgroundId],
    queryFn: () => apiClient.getSmsSettings(campgroundId!),
    enabled: !!campgroundId
  });

  // Form state
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [smsWelcomeMessage, setSmsWelcomeMessage] = useState("");
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [authTokenSet, setAuthTokenSet] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (settingsQuery.data) {
      setSmsEnabled(settingsQuery.data.smsEnabled || false);
      setTwilioAccountSid(settingsQuery.data.twilioAccountSid || "");
      setTwilioFromNumber(settingsQuery.data.twilioFromNumber || "");
      setSmsWelcomeMessage(settingsQuery.data.smsWelcomeMessage || "");
      setAuthTokenSet(settingsQuery.data.twilioAuthTokenSet || false);
      // Don't populate auth token - it's never returned from the server
    }
  }, [settingsQuery.data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!campgroundId) throw new Error("Campground required");
      return apiClient.updateSmsSettings(campgroundId, {
        smsEnabled,
        twilioAccountSid: twilioAccountSid || null,
        // Only send auth token if it was changed (not empty)
        twilioAuthToken: twilioAuthToken || undefined,
        twilioFromNumber: twilioFromNumber || null,
        smsWelcomeMessage: smsWelcomeMessage || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-settings", campgroundId] });
      toast({ title: "Saved", description: "SMS settings updated successfully." });
      // Clear the auth token field after save (it's now stored securely)
      if (twilioAuthToken) {
        setTwilioAuthToken("");
        setAuthTokenSet(true);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Save failed",
        description: err?.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Check if configuration is complete
  const isConfigComplete = twilioAccountSid && (authTokenSet || twilioAuthToken) && twilioFromNumber;

  if (!campgroundId) {
    return (
      <div className="max-w-4xl">
        <div className="p-6 text-slate-600">Select or create a campground to manage SMS settings.</div>
      </div>
    );
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="max-w-4xl flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Phone className="h-6 w-6" />
          SMS / Text Messages
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure Twilio to send and receive SMS messages with guests.
        </p>
      </div>

      {/* Status Card */}
      <Card className={smsEnabled && isConfigComplete ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {smsEnabled && isConfigComplete ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <MessageSquare className="h-5 w-5 text-slate-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">
                  {smsEnabled && isConfigComplete ? "SMS Enabled" : "SMS Disabled"}
                </CardTitle>
                <CardDescription>
                  {smsEnabled && isConfigComplete
                    ? "Your campground can send and receive text messages."
                    : "Enable SMS to communicate with guests via text."}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>
        </CardHeader>
        {smsEnabled && !isConfigComplete && (
          <CardContent>
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                SMS is enabled but not configured. Add your Twilio credentials below to start sending messages.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Twilio Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Twilio Configuration
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-normal text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Open Twilio Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardTitle>
          <CardDescription>
            Enter your Twilio credentials. You can find these in your Twilio console dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twilioAccountSid">Account SID</Label>
            <Input
              id="twilioAccountSid"
              value={twilioAccountSid}
              onChange={(e) => setTwilioAccountSid(e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono"
            />
            <p className="text-xs text-slate-500">
              Found on your Twilio Console dashboard. Starts with "AC".
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilioAuthToken">Auth Token</Label>
            <div className="relative">
              <Input
                id="twilioAuthToken"
                type={showAuthToken ? "text" : "password"}
                value={twilioAuthToken}
                onChange={(e) => setTwilioAuthToken(e.target.value)}
                placeholder={authTokenSet ? "••••••••••••••••••••••••••••••••" : "Enter your auth token"}
                className="font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showAuthToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {authTokenSet && !twilioAuthToken && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Auth token is set. Leave blank to keep current value.
              </p>
            )}
            {!authTokenSet && (
              <p className="text-xs text-slate-500">
                Found on your Twilio Console dashboard. Keep this secret!
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilioFromNumber">Twilio Phone Number</Label>
            <Input
              id="twilioFromNumber"
              value={twilioFromNumber}
              onChange={(e) => setTwilioFromNumber(e.target.value)}
              placeholder="+1234567890"
              className="font-mono"
            />
            <p className="text-xs text-slate-500">
              Your Twilio phone number in E.164 format (e.g., +15551234567).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Optional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Message Settings</CardTitle>
          <CardDescription>
            Customize how SMS messages are sent from your campground.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smsWelcomeMessage">Welcome Message (Optional)</Label>
            <Textarea
              id="smsWelcomeMessage"
              value={smsWelcomeMessage}
              onChange={(e) => setSmsWelcomeMessage(e.target.value)}
              placeholder="Example: Hi! Thanks for booking at Sunny Pines. Reply STOP to opt out."
              rows={3}
            />
            <p className="text-xs text-slate-500">
              Automatically sent when a guest's reservation is confirmed. Leave blank to skip.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                About SMS Pricing
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                SMS messages are billed directly through your Twilio account. Typical rates are
                around $0.0079/message for US numbers. You'll only pay Twilio for what you use.
              </p>
              <a
                href="https://www.twilio.com/en-us/pricing/messaging"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Twilio Pricing
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Link
          href="/messages"
          className="text-sm text-slate-600 hover:text-emerald-600"
        >
          Go to Messages
        </Link>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
