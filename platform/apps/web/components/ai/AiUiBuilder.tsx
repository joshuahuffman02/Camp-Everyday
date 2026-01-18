"use client";

import { useMemo, useState } from "react";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AI_UI_BUILDER_CONFIGS, type AiUiBuilderId } from "./ai-ui-builder-config";
import { jsonRenderRegistry } from "./json-render-registry";

type JsonRenderElement = {
  key: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  parentKey?: string | null;
  visible?: unknown;
};

type JsonRenderTree = {
  root: string;
  elements: Record<string, JsonRenderElement>;
};

type AiUiBuilderProps = {
  builderId: AiUiBuilderId;
};

export function AiUiBuilder({ builderId }: AiUiBuilderProps) {
  const config = AI_UI_BUILDER_CONFIGS[builderId];
  const { campgroundId } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [tree, setTree] = useState<JsonRenderTree | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const actionHandlers = useMemo(
    () => ({
      refresh_data: () => {
        toast({ title: "Refreshing data", description: "Metrics will update shortly." });
      },
      export_report: () => {
        toast({ title: "Export queued", description: "A CSV export is being prepared." });
      },
      open_report: () => {
        toast({ title: "Report opened", description: "Jumped to the detailed report view." });
      },
      run_report: () => {
        toast({ title: "Report running", description: "We are fetching the latest results." });
      },
      save_report: () => {
        toast({ title: "Report saved", description: "Your layout was added to saved reports." });
      },
      save_workflow: () => {
        toast({ title: "Workflow saved", description: "Staff will see updates immediately." });
      },
      assign_task: () => {
        toast({ title: "Task assigned", description: "Assignment sent to the team." });
      },
      mark_complete: () => {
        toast({ title: "Task completed", description: "Checklist updated." });
      },
    }),
    [toast],
  );

  const handleGenerate = async () => {
    setError(null);
    setWarnings([]);

    if (!campgroundId) {
      setError("Select a campground to generate UI.");
      return;
    }

    if (!prompt.trim()) {
      setError("Enter a prompt to generate the UI.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.generateAiUiTree({
        campgroundId,
        builder: builderId,
        prompt: prompt.trim(),
      });
      setTree(response.tree);
      setWarnings(response.warnings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate UI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (value: string) => {
    setPrompt(value);
    setError(null);
  };

  const handleReset = () => {
    setPrompt("");
    setTree(null);
    setWarnings([]);
    setError(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{config.label}</CardTitle>
            <Badge variant="outline">json-render</Badge>
          </div>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={config.promptPlaceholder}
            rows={6}
          />
          <div className="flex flex-wrap gap-2">
            {config.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:border-action-primary/40 hover:text-action-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate UI"}
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
              Reset
            </Button>
          </div>
          {error && (
            <div className="rounded-lg border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error">
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-3 text-xs text-status-warning-foreground">
              <div className="font-semibold">Prompt warnings</div>
              <ul className="list-disc pl-4">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Generated layout rendered with the Keepr component registry.</CardDescription>
        </CardHeader>
        <CardContent>
          {tree ? (
            <JSONUIProvider
              registry={jsonRenderRegistry}
              initialData={config.dataModel}
              actionHandlers={actionHandlers}
            >
              <Renderer tree={tree} registry={jsonRenderRegistry} loading={isLoading} />
            </JSONUIProvider>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              Generate a UI to preview the layout here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
