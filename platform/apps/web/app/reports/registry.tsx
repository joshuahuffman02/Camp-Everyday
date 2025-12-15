import { LayoutList, Calendar, TrendingUp, BarChart3, Users, Megaphone, LineChart, Calculator, ClipboardList, LucideIcon } from "lucide-react";

export type ReportTab = 'overview' | 'daily' | 'revenue' | 'performance' | 'guests' | 'marketing' | 'forecasting' | 'accounting' | 'audits' | 'booking-sources' | 'guest-origins';

export type SubTab = {
    id: string;
    label: string;
    description?: string;
};

export type ReportDefinition = {
    id: ReportTab;
    label: string;
    icon: LucideIcon;
    description: string;
    subReports: SubTab[];
};

export const subTabs: Record<Exclude<ReportTab, 'overview' | 'audits'>, SubTab[]> = {
    daily: [
        { id: 'daily-summary', label: 'Daily summary', description: 'Today’s pickup, arrivals, departures' },
        { id: 'transaction-log', label: 'Transaction log', description: 'Payments, refunds, charges' }
    ],
    revenue: [
        { id: 'revenue-overview', label: 'Revenue overview', description: 'Gross/Net, ADR, RevPAR' },
        { id: 'revenue-by-source', label: 'By source/channel', description: 'Online vs admin vs kiosk' }
    ],
    performance: [
        { id: 'pace', label: 'Pace vs target', description: 'On-the-books vs goals' },
        { id: 'occupancy', label: 'Occupancy & ADR', description: 'Blend by date/site type' },
        { id: 'site-breakdown', label: 'Site breakdown', description: 'RevPAR, ADR, occupancy by site' }
    ],
    guests: [
        { id: 'guest-origins', label: 'Guest origins', description: 'State/ZIP mix' },
        { id: 'guest-behavior', label: 'Behavior', description: 'Lead time, LOS, cancellations' }
    ],
    marketing: [
        { id: 'booking-sources', label: 'Booking sources', description: 'Channel mix and revenue' },
        { id: 'campaigns', label: 'Campaigns', description: 'Promo usage and lift' }
    ],
    forecasting: [
        { id: 'revenue-forecast', label: 'Revenue forecast', description: 'Projected revenue vs last year' },
        { id: 'demand-outlook', label: 'Demand outlook', description: 'Pickup by week and seasonality' },
        { id: 'pickup', label: 'Pickup', description: 'Bookings/revenue vs prior window' },
        { id: 'peak-nonpeak', label: 'Peak vs non-peak', description: 'Performance by season' }
    ],
    accounting: [
        { id: 'ledger', label: 'Ledger summary', description: 'GL net and exports' },
        { id: 'aging', label: 'Aging', description: 'AR buckets and overdue' }
    ],
    'booking-sources': [],
    'guest-origins': []
};

// Full report catalog for discoverability
export const reportCatalog: ReportDefinition[] = [
    {
        id: 'overview',
        label: 'Overview',
        icon: LayoutList,
        description: 'High-level KPIs and trends at a glance',
        subReports: [{ label: 'Dashboard summary', description: 'Revenue, occupancy, ADR, RevPAR' }]
    },
    {
        id: 'daily',
        label: 'Daily Operations',
        icon: Calendar,
        description: 'Day-to-day arrivals, departures, and transactions',
        subReports: subTabs.daily
    },
    {
        id: 'revenue',
        label: 'Revenue',
        icon: TrendingUp,
        description: 'Detailed revenue analysis and breakdowns',
        subReports: subTabs.revenue
    },
    {
        id: 'performance',
        label: 'Performance',
        icon: BarChart3,
        description: 'Site and property performance metrics',
        subReports: subTabs.performance
    },
    {
        id: 'guests',
        label: 'Guests',
        icon: Users,
        description: 'Guest demographics and behavior patterns',
        subReports: subTabs.guests
    },
    {
        id: 'marketing',
        label: 'Marketing',
        icon: Megaphone,
        description: 'Booking sources and campaign effectiveness',
        subReports: subTabs.marketing
    },
    {
        id: 'forecasting',
        label: 'Forecasting',
        icon: LineChart,
        description: 'Projections and demand predictions',
        subReports: subTabs.forecasting
    },
    {
        id: 'accounting',
        label: 'Accounting',
        icon: Calculator,
        description: 'Financial ledgers and aging reports',
        subReports: subTabs.accounting
    },
    {
        id: 'audits',
        label: 'Audits',
        icon: ClipboardList,
        description: 'Activity logs and compliance tracking',
        subReports: [{ label: 'Audit log', description: 'All system activity' }]
    }
];
