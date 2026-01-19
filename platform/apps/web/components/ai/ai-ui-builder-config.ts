export type AiUiBuilderId = "dashboard" | "report" | "workflow";

export type AiUiBuilderConfig = {
  id: AiUiBuilderId;
  label: string;
  description: string;
  promptPlaceholder: string;
  suggestions: string[];
  presets: {
    title: string;
    description: string;
    prompt: string;
  }[];
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
    presets: [
      {
        title: "Morning ops brief",
        description: "KPI snapshot with arrivals and a 7-day occupancy trend.",
        prompt:
          "Build a morning ops dashboard with occupancy, ADR, RevPAR, arrivals today, and a 7-day occupancy trend chart.",
      },
      {
        title: "Revenue focus",
        description: "Highlight revenue MTD, RevPAR, and top site classes.",
        prompt:
          "Create a revenue dashboard with revenue MTD, RevPAR, cancellation rate, and a revenue trend chart plus a top site classes table.",
      },
      {
        title: "Weekend watch",
        description: "Track weekend occupancy and cancellation risk.",
        prompt:
          "Design a weekend watch dashboard highlighting occupancy rate, cancellation rate, and a trend chart for the next 7 days.",
      },
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
    presets: [
      {
        title: "Channel performance",
        description: "Filter by channel and summarize revenue impact.",
        prompt:
          "Compose a report layout with channel and date filters, summary KPIs, and a results table for daily revenue and bookings.",
      },
      {
        title: "Stay length summary",
        description: "Summarize nights, revenue, and average stay.",
        prompt:
          "Build a report view with date and site class filters, summary metrics for nights and revenue, and a detailed daily table.",
      },
      {
        title: "Occupancy audit",
        description: "Combine summary metrics with a trend chart.",
        prompt:
          "Create a report layout with summary KPIs, an occupancy trend chart, and a table of daily bookings and revenue.",
      },
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
    presets: [
      {
        title: "Arrival checklist",
        description: "Guest-facing steps with notes and save action.",
        prompt:
          "Build an arrival workflow with a checklist, guest name header, notes field, and a save workflow action.",
      },
      {
        title: "Maintenance triage",
        description: "Checklist plus assignment action for staff.",
        prompt:
          "Design a maintenance workflow with a checklist, notes field, and an assign task action button.",
      },
      {
        title: "Housekeeping turnover",
        description: "Fast checklist and mark complete action.",
        prompt:
          "Create a housekeeping turnover workflow with a checklist, notes, and a mark complete action.",
      },
    ],
    dataModel: workflowData,
  },
};
