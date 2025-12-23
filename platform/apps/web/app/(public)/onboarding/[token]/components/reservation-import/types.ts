// ============ Column Mapping ============

export interface ReservationImportColumnMapping {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  arrivalDate: string;
  departureDate: string;
  siteNumber?: string;
  siteName?: string;
  siteClass?: string;
  totalAmount?: string;
  paidAmount?: string;
  adults?: string;
  children?: string;
  confirmationNumber?: string;
  status?: string;
  notes?: string;
}

// ============ Parsed Row ============

export interface ParsedReservationRow {
  rowIndex: number;
  rawData: Record<string, string>;
  guest: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  stay: {
    arrivalDate: string;
    departureDate: string;
    nights: number;
  };
  siteIdentifier: {
    siteNumber?: string;
    siteName?: string;
    siteClassName?: string;
  };
  pricing: {
    totalAmountCents?: number;
    paidAmountCents?: number;
    balanceCents?: number;
  };
  meta: {
    confirmationNumber?: string;
    status?: string;
    notes?: string;
    adults: number;
    children: number;
  };
  errors: string[];
}

// ============ Match Results ============

export interface SiteMatchResult {
  matchType: "exact_number" | "exact_name" | "class_assignment" | "manual_required";
  matchedSiteId?: string;
  matchedSiteName?: string;
  matchedSiteNumber?: string;
  suggestedSiteClassId?: string;
  suggestedSiteClassName?: string;
  availableSites?: Array<{ id: string; name: string; siteNumber: string }>;
  conflict?: string;
}

export interface GuestMatchResult {
  matchType: "existing" | "will_create";
  existingGuestId?: string;
  existingGuestName?: string;
  existingGuestEmail?: string;
}

export interface PricingComparison {
  csvTotalCents: number;
  calculatedTotalCents: number;
  difference: number;
  differencePercent: number;
  requiresReview: boolean;
}

export interface MatchResult {
  rowIndex: number;
  site: SiteMatchResult;
  guest: GuestMatchResult;
  pricing: PricingComparison;
  useSystemPricing: boolean;
  skip: boolean;
}

// ============ Preview Response ============

export interface ReservationImportPreview {
  parsedRows: ParsedReservationRow[];
  matchResults: MatchResult[];
  summary: {
    totalRows: number;
    validRows: number;
    sitesMatched: number;
    sitesNeedSelection: number;
    guestsFound: number;
    guestsToCreate: number;
    hasConflicts: number;
    pricingDiscrepancies: number;
  };
}

// ============ Execute ============

export interface ReservationImportExecuteRow {
  rowIndex: number;
  siteId?: string;
  siteClassId?: string;
  guestId?: string;
  createGuest?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  useSystemPricing: boolean;
  manualTotalOverrideCents?: number;
  skip: boolean;
}

export interface ReservationImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ rowIndex: number; error: string }>;
  createdReservationIds: string[];
  createdGuestIds: string[];
}

// ============ Upload Response ============

export interface UploadResponse {
  headers: string[];
  suggestedMapping: Record<string, string>;
  sampleRows: Record<string, string>[];
  totalRows: number;
}

// ============ Component Props ============

export interface ReservationImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campgroundId: string;
  token: string;
  sites: Array<{ id: string; name: string; siteNumber: string; siteClassId?: string }>;
  siteClasses: Array<{ id: string; name: string }>;
  onComplete: (result: ReservationImportResult) => void;
}

// ============ Import Step ============

export type ImportStep = 1 | 2 | 3 | 4;

// ============ Row Override ============

export interface RowOverride {
  siteId?: string;
  siteClassId?: string;
  useSystemPricing: boolean;
  manualTotalOverrideCents?: number;
  skip: boolean;
}
