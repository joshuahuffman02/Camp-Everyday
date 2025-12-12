import { ReportDimensionSpec, ReportFilterSpec, ReportMetricSpec, ReportSpec, ReportSource } from "./report.types";

type SourceLibrary = {
  dimensions: Record<string, ReportDimensionSpec>;
  metrics: Record<string, ReportMetricSpec>;
  filters: ReportFilterSpec[];
};

// Shared date helpers
const dateDims: Record<string, ReportDimensionSpec> = {
  booked_day: { id: "booked_day", label: "Booked Day", field: "createdAt", kind: "date", timeGrain: "day" },
  booked_week: { id: "booked_week", label: "Booked Week", field: "createdAt", kind: "date", timeGrain: "week" },
  booked_month: { id: "booked_month", label: "Booked Month", field: "createdAt", kind: "date", timeGrain: "month" },
  arrival_day: { id: "arrival_day", label: "Arrival Day", field: "arrivalDate", kind: "date", timeGrain: "day" },
  arrival_month: { id: "arrival_month", label: "Arrival Month", field: "arrivalDate", kind: "date", timeGrain: "month" },
};

const reservationLibrary: SourceLibrary = {
  dimensions: {
    ...dateDims,
    status: { id: "status", label: "Status", field: "status", kind: "enum" },
    source: { id: "source", label: "Source", field: "source", kind: "enum", fallback: "unknown" },
    stay_type: { id: "stay_type", label: "Stay Type", field: "stayType", kind: "enum" },
    rig_type: { id: "rig_type", label: "Rig Type", field: "rigType", kind: "enum", fallback: "unspecified" },
    promo_code: { id: "promo_code", label: "Promo Code", field: "promoCode", kind: "string", fallback: "none" },
    lead_time_bucket: { id: "lead_time_bucket", label: "Lead Time Bucket", field: "leadTimeDays", kind: "number" },
    length_of_stay: { id: "length_of_stay", label: "Length of Stay", field: "nights", kind: "number" },
  },
  metrics: {
    bookings: { id: "bookings", label: "Bookings", field: "id", aggregation: "count", type: "number" },
    revenue: { id: "revenue", label: "Gross Revenue", field: "totalAmount", aggregation: "sum", type: "currency", format: "currency" },
    paid: { id: "paid", label: "Paid Amount", field: "paidAmount", aggregation: "sum", type: "currency", format: "currency" },
    balance: { id: "balance", label: "Outstanding Balance", field: "balanceAmount", aggregation: "sum", type: "currency", format: "currency" },
    adr: { id: "adr", label: "ADR", field: "totalAmount", aggregation: "avg", type: "currency", format: "currency" },
    lead_time_avg: { id: "lead_time_avg", label: "Avg Lead Time (days)", field: "leadTimeDays", aggregation: "avg", type: "number" },
  },
  filters: [
    { id: "status", label: "Status", field: "status", type: "enum", operators: ["eq", "in"], options: ["pending", "confirmed", "cancelled", "checked_in", "checked_out"] },
    { id: "source", label: "Source", field: "source", type: "enum", operators: ["eq", "in"] },
    { id: "stay_type", label: "Stay Type", field: "stayType", type: "enum", operators: ["eq", "in"], options: ["standard", "group", "long_term"] },
  ],
};

const paymentLibrary: SourceLibrary = {
  dimensions: {
    paid_day: { id: "paid_day", label: "Paid Day", field: "createdAt", kind: "date", timeGrain: "day" },
    paid_week: { id: "paid_week", label: "Paid Week", field: "createdAt", kind: "date", timeGrain: "week" },
    paid_month: { id: "paid_month", label: "Paid Month", field: "createdAt", kind: "date", timeGrain: "month" },
    method: { id: "method", label: "Payment Method", field: "method", kind: "enum" },
    direction: { id: "direction", label: "Direction", field: "direction", kind: "enum" },
  },
  metrics: {
    payments: { id: "payments", label: "Payments", field: "id", aggregation: "count", type: "number" },
    amount: { id: "amount", label: "Amount", field: "amountCents", aggregation: "sum", type: "currency", format: "currency" },
    fees: { id: "fees", label: "Platform Fees", field: "stripeFeeCents", aggregation: "sum", type: "currency", format: "currency" },
  },
  filters: [
    { id: "method", label: "Method", field: "method", type: "string", operators: ["eq", "in"] },
    { id: "direction", label: "Direction", field: "direction", type: "enum", operators: ["eq", "in"], options: ["charge", "refund"] },
  ],
};

const ledgerLibrary: SourceLibrary = {
  dimensions: {
    ledger_day: { id: "ledger_day", label: "Entry Day", field: "occurredAt", kind: "date", timeGrain: "day" },
    ledger_month: { id: "ledger_month", label: "Entry Month", field: "occurredAt", kind: "date", timeGrain: "month" },
    gl_code: { id: "gl_code", label: "GL Code", field: "glCode", kind: "string", fallback: "unassigned" },
    direction: { id: "direction", label: "Direction", field: "direction", kind: "enum" },
  },
  metrics: {
    ledger_amount: { id: "ledger_amount", label: "Ledger Amount", field: "amountCents", aggregation: "sum", type: "currency", format: "currency" },
    ledger_entries: { id: "ledger_entries", label: "Entries", field: "id", aggregation: "count", type: "number" },
  },
  filters: [
    { id: "gl_code", label: "GL Code", field: "glCode", type: "string", operators: ["eq", "in"] },
    { id: "direction", label: "Direction", field: "direction", type: "enum", operators: ["eq", "in"], options: ["debit", "credit"] },
  ],
};

const payoutLibrary: SourceLibrary = {
  dimensions: {
    payout_day: { id: "payout_day", label: "Payout Day", field: "arrivalDate", kind: "date", timeGrain: "day" },
    payout_month: { id: "payout_month", label: "Payout Month", field: "arrivalDate", kind: "date", timeGrain: "month" },
    status: { id: "status", label: "Status", field: "status", kind: "enum" },
    currency: { id: "currency", label: "Currency", field: "currency", kind: "enum" },
  },
  metrics: {
    payout_amount: { id: "payout_amount", label: "Payout Amount", field: "amountCents", aggregation: "sum", type: "currency", format: "currency" },
    payout_fee: { id: "payout_fee", label: "Payout Fees", field: "feeCents", aggregation: "sum", type: "currency", format: "currency" },
  },
  filters: [
    { id: "status", label: "Status", field: "status", type: "enum", operators: ["eq", "in"], options: ["pending", "in_transit", "paid", "failed", "canceled"] },
    { id: "currency", label: "Currency", field: "currency", type: "string", operators: ["eq", "in"] },
  ],
};

const supportLibrary: SourceLibrary = {
  dimensions: {
    support_day: { id: "support_day", label: "Created Day", field: "createdAt", kind: "date", timeGrain: "day" },
    support_month: { id: "support_month", label: "Created Month", field: "createdAt", kind: "date", timeGrain: "month" },
    status: { id: "status", label: "Status", field: "status", kind: "enum" },
    path: { id: "path", label: "Path", field: "path", kind: "string" },
    language: { id: "language", label: "Language", field: "language", kind: "string" },
  },
  metrics: {
    support_tickets: { id: "support_tickets", label: "Tickets", field: "id", aggregation: "count", type: "number" },
  },
  filters: [
    { id: "status", label: "Status", field: "status", type: "enum", operators: ["eq", "in"] },
    { id: "path", label: "Path", field: "path", type: "string", operators: ["eq", "in"] },
  ],
};

const taskLibrary: SourceLibrary = {
  dimensions: {
    task_day: { id: "task_day", label: "Task Day", field: "createdAt", kind: "date", timeGrain: "day" },
    task_month: { id: "task_month", label: "Task Month", field: "createdAt", kind: "date", timeGrain: "month" },
    state: { id: "state", label: "State", field: "state", kind: "enum" },
    sla_status: { id: "sla_status", label: "SLA Status", field: "slaStatus", kind: "enum" },
    type: { id: "type", label: "Task Type", field: "type", kind: "enum" },
  },
  metrics: {
    tasks: { id: "tasks", label: "Tasks", field: "id", aggregation: "count", type: "number" },
  },
  filters: [
    { id: "state", label: "State", field: "state", type: "enum", operators: ["eq", "in"], options: ["pending", "in_progress", "done"] },
    { id: "sla_status", label: "SLA Status", field: "slaStatus", type: "enum", operators: ["eq", "in"], options: ["on_track", "at_risk", "breached"] },
  ],
};

const marketingLibrary: SourceLibrary = {
  dimensions: {
    campaign: { id: "campaign", label: "Campaign", field: "campaign", kind: "string", fallback: "unknown" },
    channel: { id: "channel", label: "Channel", field: "channel", kind: "string", fallback: "direct" },
    medium: { id: "medium", label: "Medium", field: "medium", kind: "string", fallback: "unspecified" },
    attributed_day: { id: "attributed_day", label: "Attributed Day", field: "createdAt", kind: "date", timeGrain: "day" },
    attributed_month: { id: "attributed_month", label: "Attributed Month", field: "createdAt", kind: "date", timeGrain: "month" },
  },
  metrics: {
    touches: { id: "touches", label: "Touches", field: "id", aggregation: "count", type: "number" },
    conversions: { id: "conversions", label: "Attributed Bookings", field: "conversions", aggregation: "sum", type: "number" },
  },
  filters: [
    { id: "channel", label: "Channel", field: "channel", type: "string", operators: ["eq", "in"] },
    { id: "campaign", label: "Campaign", field: "campaign", type: "string", operators: ["eq", "in"] },
  ],
};

export const libraries: Record<ReportSource, SourceLibrary> = {
  reservation: reservationLibrary,
  payment: paymentLibrary,
  ledger: ledgerLibrary,
  payout: payoutLibrary,
  support: supportLibrary,
  task: taskLibrary,
  marketing: marketingLibrary,
};

const bookingTemplates: ReportSpec[] = [
  { id: "bookings.daily_bookings", name: "Daily bookings", category: "Bookings", source: "reservation", dimensions: ["booked_day"], metrics: ["bookings", "revenue", "paid"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "bar", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "bookings.weekly_bookings", name: "Weekly bookings", category: "Bookings", source: "reservation", dimensions: ["booked_week"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "bar", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "bookings.monthly_revenue", name: "Monthly revenue", category: "Bookings", source: "reservation", dimensions: ["booked_month"], metrics: ["revenue", "adr"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "bar", "table"], defaultChart: "bar", sampling: { limit: 4000 } },
  { id: "bookings.channel_mix", name: "Channel mix", category: "Bookings", source: "reservation", dimensions: ["source"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "bookings.status_funnel", name: "Status funnel", category: "Bookings", source: "reservation", dimensions: ["status"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["bar", "pie", "table"], defaultChart: "bar", sampling: { limit: 4000 } },
  { id: "bookings.lead_time", name: "Lead time distribution", category: "Bookings", source: "reservation", dimensions: ["lead_time_bucket"], metrics: ["bookings", "lead_time_avg"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "bookings.length_of_stay", name: "Length of stay", category: "Bookings", source: "reservation", dimensions: ["length_of_stay"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "bookings.promo_performance", name: "Promo code performance", category: "Bookings", source: "reservation", dimensions: ["promo_code"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table", "pie"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "bookings.stay_type_mix", name: "Stay type mix", category: "Bookings", source: "reservation", dimensions: ["stay_type"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["pie", "table", "bar"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "bookings.rig_type_mix", name: "Rig type mix", category: "Bookings", source: "reservation", dimensions: ["rig_type"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["pie", "table", "bar"], defaultChart: "pie", sampling: { limit: 5000 } },
  { id: "bookings.arrival_month", name: "Arrivals by month", category: "Bookings", source: "reservation", dimensions: ["arrival_month"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "bar", "table"], defaultChart: "line", sampling: { limit: 5000 } },
  { id: "bookings.arrival_day", name: "Arrivals by day", category: "Bookings", source: "reservation", dimensions: ["arrival_day"], metrics: ["bookings", "revenue"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 5000 } },
  { id: "bookings.cancellation_rate", name: "Cancellation share", category: "Bookings", source: "reservation", dimensions: ["status"], metrics: ["bookings"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["pie", "table"], defaultChart: "pie", sampling: { limit: 5000 }, heavy: false },
  { id: "bookings.adr_by_source", name: "ADR by source", category: "Bookings", source: "reservation", dimensions: ["source"], metrics: ["adr", "revenue"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "bookings.balance_by_status", name: "Balance by status", category: "Bookings", source: "reservation", dimensions: ["status"], metrics: ["balance", "paid"], defaultTimeRange: { preset: "last_60_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
];

const inventoryTemplates: ReportSpec[] = [
  { id: "inventory.arrival_load_day", name: "Arrival load by day", category: "Inventory", source: "reservation", dimensions: ["arrival_day"], metrics: ["bookings"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "inventory.arrival_load_month", name: "Arrival load by month", category: "Inventory", source: "reservation", dimensions: ["arrival_month"], metrics: ["bookings"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["bar", "line", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "inventory.status_mix", name: "Reservation status mix", category: "Inventory", source: "reservation", dimensions: ["status"], metrics: ["bookings"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "inventory.stay_type_load", name: "Stay type load", category: "Inventory", source: "reservation", dimensions: ["stay_type"], metrics: ["bookings"], defaultTimeRange: { preset: "last_60_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "inventory.rig_type_load", name: "Rig type load", category: "Inventory", source: "reservation", dimensions: ["rig_type"], metrics: ["bookings"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "pie", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "inventory.lead_time_forecast", name: "Lead time forecast", category: "Inventory", source: "reservation", dimensions: ["lead_time_bucket"], metrics: ["bookings"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 }, heavy: true },
  { id: "inventory.length_of_stay_mix", name: "Length-of-stay mix", category: "Inventory", source: "reservation", dimensions: ["length_of_stay"], metrics: ["bookings"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "inventory.arrival_vs_booked", name: "Arrival vs booked month", category: "Inventory", source: "reservation", dimensions: ["arrival_month", "booked_month"], metrics: ["bookings"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["table"], defaultChart: "table", sampling: { limit: 5000 }, heavy: true },
  { id: "inventory.promo_impact", name: "Promo impact on occupancy", category: "Inventory", source: "reservation", dimensions: ["promo_code"], metrics: ["bookings", "adr"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "inventory.balance_watch", name: "Balance watchlist", category: "Inventory", source: "reservation", dimensions: ["status"], metrics: ["balance"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["table", "bar"], defaultChart: "table", sampling: { limit: 3000 } },
];

const paymentTemplates: ReportSpec[] = [
  { id: "payments.daily_cashflow", name: "Daily cashflow", category: "Payments", source: "payment", dimensions: ["paid_day"], metrics: ["amount", "payments"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "bar", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "payments.weekly_cashflow", name: "Weekly cashflow", category: "Payments", source: "payment", dimensions: ["paid_week"], metrics: ["amount"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["line", "bar", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "payments.method_mix", name: "Method mix", category: "Payments", source: "payment", dimensions: ["method"], metrics: ["amount", "payments"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "payments.direction_mix", name: "Charges vs refunds", category: "Payments", source: "payment", dimensions: ["direction"], metrics: ["amount", "payments"], defaultTimeRange: { preset: "last_60_days" }, chartTypes: ["bar", "pie", "table"], defaultChart: "bar", sampling: { limit: 4000 } },
  { id: "payments.refund_rate", name: "Refund rate", category: "Payments", source: "payment", dimensions: ["direction"], metrics: ["payments"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["pie", "table"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "payments.fees", name: "Processor fees", category: "Payments", source: "payment", dimensions: ["paid_month"], metrics: ["fees", "amount"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 4000 } },
  { id: "payments.avg_ticket", name: "Average ticket", category: "Payments", source: "payment", dimensions: ["paid_month"], metrics: ["amount"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "payments.charge_volume", name: "Charge volume", category: "Payments", source: "payment", dimensions: ["paid_month"], metrics: ["payments"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "payments.method_success", name: "Method success rate", category: "Payments", source: "payment", dimensions: ["method"], metrics: ["payments"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 4000 }, heavy: false },
  { id: "payments.payout_alignment", name: "Payout alignment", category: "Payments", source: "payout", dimensions: ["payout_month", "status"], metrics: ["payout_amount", "payout_fee"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["table", "bar"], defaultChart: "table", sampling: { limit: 4000 }, heavy: true },
];

const ledgerTemplates: ReportSpec[] = [
  { id: "ledger.entries_month", name: "Ledger entries by month", category: "Payments", source: "ledger", dimensions: ["ledger_month"], metrics: ["ledger_amount", "ledger_entries"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "ledger.gl_code_mix", name: "GL code mix", category: "Payments", source: "ledger", dimensions: ["gl_code"], metrics: ["ledger_amount", "ledger_entries"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "ledger.debits_credits", name: "Debits vs credits", category: "Payments", source: "ledger", dimensions: ["direction"], metrics: ["ledger_amount", "ledger_entries"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 5000 } },
  { id: "ledger.daily_entries", name: "Daily ledger entries", category: "Payments", source: "ledger", dimensions: ["ledger_day"], metrics: ["ledger_amount"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "ledger.monthly_net", name: "Monthly net ledger", category: "Payments", source: "ledger", dimensions: ["ledger_month", "direction"], metrics: ["ledger_amount"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["table"], defaultChart: "table", sampling: { limit: 5000 }, heavy: true },
];

const operationsTemplates: ReportSpec[] = [
  { id: "ops.tasks_by_state", name: "Tasks by state", category: "Operations", source: "task", dimensions: ["state"], metrics: ["tasks"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 4000 } },
  { id: "ops.tasks_by_day", name: "Tasks by day", category: "Operations", source: "task", dimensions: ["task_day"], metrics: ["tasks"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "ops.tasks_by_sla", name: "Tasks by SLA status", category: "Operations", source: "task", dimensions: ["sla_status"], metrics: ["tasks"], defaultTimeRange: { preset: "last_60_days" }, chartTypes: ["bar", "pie", "table"], defaultChart: "bar", sampling: { limit: 4000 } },
  { id: "ops.tasks_by_type", name: "Tasks by type", category: "Operations", source: "task", dimensions: ["type"], metrics: ["tasks"], defaultTimeRange: { preset: "last_60_days" }, chartTypes: ["pie", "table"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "ops.support_volume_day", name: "Support volume by day", category: "Operations", source: "support", dimensions: ["support_day"], metrics: ["support_tickets"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 4000 } },
  { id: "ops.support_status", name: "Support by status", category: "Operations", source: "support", dimensions: ["status"], metrics: ["support_tickets"], defaultTimeRange: { preset: "last_30_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 4000 } },
  { id: "ops.support_paths", name: "Support by path", category: "Operations", source: "support", dimensions: ["path"], metrics: ["support_tickets"], defaultTimeRange: { preset: "last_60_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "ops.support_language", name: "Support by language", category: "Operations", source: "support", dimensions: ["language"], metrics: ["support_tickets"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "ops.tasks_month", name: "Tasks by month", category: "Operations", source: "task", dimensions: ["task_month"], metrics: ["tasks"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 5000 } },
  { id: "ops.tasks_state_month", name: "Task state by month", category: "Operations", source: "task", dimensions: ["task_month", "state"], metrics: ["tasks"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["table"], defaultChart: "table", sampling: { limit: 5000 }, heavy: true },
];

const marketingTemplates: ReportSpec[] = [
  { id: "marketing.channel_mix", name: "Channel mix", category: "Marketing", source: "marketing", dimensions: ["channel"], metrics: ["touches"], defaultTimeRange: { preset: "last_90_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 5000 } },
  { id: "marketing.campaign_performance", name: "Campaign performance", category: "Marketing", source: "marketing", dimensions: ["campaign"], metrics: ["touches", "conversions"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "marketing.medium_mix", name: "Medium mix", category: "Marketing", source: "marketing", dimensions: ["medium"], metrics: ["touches"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["pie", "bar", "table"], defaultChart: "pie", sampling: { limit: 5000 } },
  { id: "marketing.channel_trend", name: "Channel trend", category: "Marketing", source: "marketing", dimensions: ["attributed_month"], metrics: ["touches"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["line", "table"], defaultChart: "line", sampling: { limit: 5000 } },
  { id: "marketing.campaign_trend", name: "Campaign trend", category: "Marketing", source: "marketing", dimensions: ["attributed_month", "campaign"], metrics: ["touches"], defaultTimeRange: { preset: "last_12_months" }, chartTypes: ["table"], defaultChart: "table", sampling: { limit: 5000 }, heavy: true },
  { id: "marketing.conversion_by_channel", name: "Conversions by channel", category: "Marketing", source: "marketing", dimensions: ["channel"], metrics: ["conversions"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "marketing.conversion_by_campaign", name: "Conversions by campaign", category: "Marketing", source: "marketing", dimensions: ["campaign"], metrics: ["conversions"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["bar", "table"], defaultChart: "bar", sampling: { limit: 5000 } },
  { id: "marketing.channel_medium", name: "Channel by medium", category: "Marketing", source: "marketing", dimensions: ["channel", "medium"], metrics: ["touches"], defaultTimeRange: { preset: "last_180_days" }, chartTypes: ["table"], defaultChart: "table", sampling: { limit: 5000 }, heavy: true },
];

const definitions: ReportSpec[] = [
  ...bookingTemplates,
  ...inventoryTemplates,
  ...paymentTemplates,
  ...ledgerTemplates,
  ...operationsTemplates,
  ...marketingTemplates,
];

export function getReportCatalog(opts?: { category?: string; search?: string; includeHeavy?: boolean }) {
  const search = opts?.search?.toLowerCase();
  return definitions.filter((def) => {
    if (opts?.category && def.category !== opts.category) return false;
    if (!opts?.includeHeavy && def.heavy) return false;
    if (search && !`${def.name} ${def.id} ${def.description ?? ""}`.toLowerCase().includes(search)) return false;
    return true;
  });
}

export function getReportSpec(id: string) {
  return definitions.find((d) => d.id === id);
}

export function resolveDimension(source: ReportSource, id: string) {
  return libraries[source]?.dimensions[id];
}

export function resolveMetric(source: ReportSource, id: string) {
  return libraries[source]?.metrics[id];
}

export function resolveFilters(source: ReportSource) {
  return libraries[source]?.filters ?? [];
}

export function registrySize() {
  return definitions.length;
}

// Scaling hint: new reports can be added by combining existing dimensions/metrics
// and time grains; templates above cover five domains. Adding site_class or region
// dimensions, or cloning time grains, easily grows the catalog past 100 without code changes.
