"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignPage() {
  const params = useParams();
  const token = params.token as string;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [result, setResult] = useState<"idle" | "signed" | "declined" | "error">("idle");

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoadingRequest(true);
      try {
        const res = await fetch(`/api/signatures/requests/token/${token}`);
        if (!res.ok) throw new Error("Failed to load request");
        const data = await res.json();
        setRequest(data);
        setName(data?.recipientName || data?.metadata?.signerName || "");
        setEmail(data?.recipientEmail || "");
        if (data?.status === "signed") setResult("signed");
        if (data?.status === "declined") setResult("declined");
      } catch {
        setRequest(null);
      } finally {
        setLoadingRequest(false);
      }
    };
    load();
  }, [token]);

  const submit = async (status: "signed" | "declined") => {
    setLoading(true);
    try {
      const res = await fetch("/api/signatures/webhooks/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          status,
          recipientEmail: email || undefined,
          metadata: { signer: name, signerName: name, signerEmail: email }
        })
      });
      if (!res.ok) throw new Error("Failed");
      setResult(status);
    } catch (err) {
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  const policyTitle = request?.template?.name || request?.subject || "Review and Sign";
  const policyContent = request?.template?.content || request?.message || "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>{policyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRequest ? (
              <p className="text-sm text-slate-600">Loading policy details…</p>
            ) : request ? (
              <>
                <p className="text-sm text-slate-600">
                  Please review the policy below and sign to acknowledge.
                </p>
                {policyContent && (
                  <div className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-72 overflow-auto">
                    {policyContent}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-rose-600">Unable to load this signature request.</p>
            )}

            <div className="space-y-2">
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email for receipt" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="flex items-start gap-2 rounded border border-slate-200 bg-slate-50 p-3">
              <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
              <label htmlFor="accept" className="text-sm text-slate-700">
                I have reviewed the long-term stay agreement, park rules, deposit/fee summary, waiver, and COI requirements.
              </label>
            </div>

            {result === "signed" && <div className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Thank you! Your signature is recorded.</div>}
            {result === "declined" && <div className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">You declined this request. The park will be notified.</div>}
            {result === "error" && <div className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">Something went wrong. Please try again.</div>}

            <div className="flex flex-wrap gap-2">
              <Button disabled={!accepted || loading || result === "signed"} onClick={() => submit("signed")}>
                {loading ? "Submitting..." : "Sign and submit"}
              </Button>
              <Button variant="outline" disabled={loading || result === "signed"} onClick={() => submit("declined")}>
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
