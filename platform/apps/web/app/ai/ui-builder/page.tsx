import { AiUiBuilder } from "@/components/ai/AiUiBuilder";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AiUiBuilderPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI UI Builder</h1>
            <p className="text-sm text-muted-foreground">
              Generate dashboards, reports, and workflows from structured prompts.
            </p>
          </div>
          <Badge variant="outline">Experimental</Badge>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="report">Reports</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="pt-4">
            <AiUiBuilder builderId="dashboard" />
          </TabsContent>
          <TabsContent value="report" className="pt-4">
            <AiUiBuilder builderId="report" />
          </TabsContent>
          <TabsContent value="workflow" className="pt-4">
            <AiUiBuilder builderId="workflow" />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
