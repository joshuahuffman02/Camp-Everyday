export type AiUiBuilderId = "dashboard" | "report" | "workflow";

export type AiUiBuilderConfig = {
  id: AiUiBuilderId;
  label: string;
  description: string;
  promptPlaceholder: string;
  suggestions: string[];
  dataModel: Record<string, unknown>;
};

const dashboardData: Record<string, unknown> = {
  metrics: {
    occupancyRate: 0.78,
    adr: 142.5,
    revpar: 110.2,
    bookingsToday: 24,
    cancellationRate: 0.06,
    revenueMTD: 185000,
  },
  trends: {
    occupancy: [
      { label: "Mon", value: 0.72 },
      { label: "Tue", value: 0.75 },
      { label: "Wed", value: 0.78 },
      { label: "Thu", value: 0.8 },
      { label: "Fri", value: 0.84 },
      { label: "Sat", value: 0.86 },
      { label: "Sun", value: 0.79 },
    ],
    revenue: [
      { label: "Week 1", value: 42000 },
      { label: "Week 2", value: 45500 },
      { label: "Week 3", value: 46800 },
      { label: "Week 4", value: 51000 },
    ],
  },
  tables: {
    topSites: [
      { siteClass: "Premium RV", occupancyRate: 0.92, adr: 175 },
      { siteClass: "Standard RV", occupancyRate: 0.81, adr: 145 },
      { siteClass: "Tent", occupancyRate: 0.74, adr: 68 },
      { siteClass: "Cabin", occupancyRate: 0.88, adr: 220 },
    ],
  },
};

const reportData: Record<string, unknown> = {
  filters: {
    dateRange: "Last 30 days",
    channel: "all",
    siteClass: "all",
  },
  report: {
    summary: {
      totalRevenue: 320000,
      totalNights: 1240,
      avgStayLength: 2.8,
    },
    rows: [
      { date: "2025-01-01", bookings: 32, revenue: 14250, occupancyRate: 0.76 },
      { date: "2025-01-02", bookings: 28, revenue: 13110, occupancyRate: 0.72 },
      { date: "2025-01-03", bookings: 35, revenue: 15890, occupancyRate: 0.82 },
      { date: "2025-01-04", bookings: 41, revenue: 17640, occupancyRate: 0.88 },
      { date: "2025-01-05", bookings: 29, revenue: 13820, occupancyRate: 0.74 },
    ],
  },
};

const workflowData: Record<string, unknown> = {
  workflow: {
    title: "Arrival Checklist",
    assignedTeam: "Front Desk",
    notes: "",
    steps: [
      { label: "Verify reservation details", done: true },
      { label: "Confirm payment status", done: false },
      { label: "Collect vehicle info", done: false },
      { label: "Explain park quiet hours", done: false },
    ],
  },
  guest: {
    name: "Jordan Smith",
  },
};

export const AI_UI_BUILDER_CONFIGS: Record<AiUiBuilderId, AiUiBuilderConfig> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard Builder",
    description: "Generate KPI dashboards with metrics, charts, and tables.",
    promptPlaceholder: "Build a dashboard highlighting occupancy, ADR, and weekend pickup trends.",
    suggestions: [
      "Create a revenue dashboard with occupancy KPIs and a weekly revenue chart.",
      "Show a compact dashboard with top site classes and cancellation rate.",
      "Build a manager view focusing on RevPAR, ADR, and bookings today.",
    ],
    dataModel: dashboardData,
  },
  report: {
    id: "report",
    label: "Report Composer",
    description: "Compose report layouts with filters and export actions.",
    promptPlaceholder: "Design a report layout with filters and a detailed results table.",
    suggestions: [
      "Create a report view with filter controls and summary KPIs.",
      "Build a layout that highlights revenue, nights, and occupancy trends.",
      "Compose a table-first report with an export button and summary row.",
    ],
    dataModel: reportData,
  },
  workflow: {
    id: "workflow",
    label: "Workflow Builder",
    description: "Draft staff workflows with checklists and action buttons.",
    promptPlaceholder: "Build a staff workflow for check-in with a checklist and notes section.",
    suggestions: [
      "Create a housekeeping workflow with checklist items and a notes field.",
      "Design a workflow for late arrivals with steps and a primary action.",
      "Build a maintenance workflow with task checklist and assignment button.",
    ],
    dataModel: workflowData,
  },
};
