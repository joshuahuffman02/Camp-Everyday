-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('rv', 'tent', 'cabin', 'group', 'glamping');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('open', 'in_progress', 'closed');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignSendStatus" AS ENUM ('queued', 'sent', 'failed', 'unsubscribed');

-- CreateEnum
CREATE TYPE "SupportReportStatus" AS ENUM ('new', 'triage', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('email', 'sms', 'both');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'manager', 'front_desk', 'maintenance', 'finance', 'marketing', 'readonly');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('guest', 'staff');

-- CreateEnum
CREATE TYPE "TaxRuleType" AS ENUM ('percentage', 'flat', 'exemption');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('nightly', 'weekly', 'monthly', 'seasonal');

-- CreateEnum
CREATE TYPE "StayType" AS ENUM ('standard', 'weekly', 'monthly', 'seasonal');

-- CreateEnum
CREATE TYPE "PaymentSchedule" AS ENUM ('single', 'weekly', 'monthly', 'as_you_stay', 'offseason_installments');

-- CreateEnum
CREATE TYPE "PricingStructure" AS ENUM ('per_night', 'flat_week', 'flat_month', 'flat_season');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('pending', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('facebook', 'instagram', 'tiktok', 'email', 'blog');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('draft', 'scheduled', 'needs_image', 'needs_approval', 'ready', 'completed', 'dismissed');

-- CreateEnum
CREATE TYPE "SocialContentCategory" AS ENUM ('amenities', 'events', 'offers', 'reviews', 'tips', 'general', 'promo');

-- CreateEnum
CREATE TYPE "SocialTemplateStyle" AS ENUM ('short', 'detailed', 'story', 'carousel', 'announce');

-- CreateEnum
CREATE TYPE "SocialAssetType" AS ENUM ('photo', 'video', 'logo', 'template', 'other');

-- CreateEnum
CREATE TYPE "SocialSuggestionType" AS ENUM ('idea', 'auto', 'operator');

-- CreateEnum
CREATE TYPE "SocialSuggestionStatus" AS ENUM ('new', 'accepted', 'rejected', 'published');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('allow', 'deny');

-- CreateEnum
CREATE TYPE "PiiClassification" AS ENUM ('basic', 'sensitive', 'payment', 'secret');

-- CreateEnum
CREATE TYPE "RedactionMode" AS ENUM ('mask', 'remove');

-- CreateEnum
CREATE TYPE "ConsentMethod" AS ENUM ('verbal', 'written', 'digital');

-- CreateEnum
CREATE TYPE "SocialAlertCategory" AS ENUM ('weather', 'occupancy', 'events', 'deals', 'reviews', 'inactivity', 'inventory');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('ota_only', 'standard', 'enterprise');

-- CreateEnum
CREATE TYPE "PaymentFeeMode" AS ENUM ('absorb', 'pass_through');

-- CreateEnum
CREATE TYPE "NpsSurveyStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "NpsInviteStatus" AS ENUM ('queued', 'sent', 'bounced', 'opened', 'responded', 'expired');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'removed');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('onsite', 'email', 'sms', 'kiosk', 'import');

-- CreateEnum
CREATE TYPE "ReviewExposure" AS ENUM ('private', 'public');

-- CreateEnum
CREATE TYPE "ReviewVoteValue" AS ENUM ('helpful', 'not_helpful');

-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AnalyticsEventName" AS ENUM ('page_view', 'site_card_view', 'image_viewed', 'image_hovered', 'image_clicked', 'site_class_viewed', 'availability_check', 'add_to_stay', 'reservation_start', 'reservation_abandoned', 'reservation_completed', 'deal_viewed', 'deal_applied', 'email_signup', 'review_viewed', 'admin_pricing_change', 'admin_image_reorder');

-- CreateEnum
CREATE TYPE "AbTestStatus" AS ENUM ('draft', 'active', 'paused', 'stopped', 'completed');

-- CreateEnum
CREATE TYPE "GamificationEventCategory" AS ENUM ('task', 'maintenance', 'check_in', 'reservation_quality', 'checklist', 'review_mention', 'on_time_assignment', 'assist', 'manual', 'other');

-- CreateEnum
CREATE TYPE "FormTemplateType" AS ENUM ('waiver', 'vehicle', 'intake', 'custom');

-- CreateEnum
CREATE TYPE "FormSubmissionStatus" AS ENUM ('pending', 'completed', 'void');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('warning_needs_response', 'warning_under_review', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('activity', 'workshop', 'entertainment', 'holiday', 'recurring', 'ongoing', 'themed');

-- CreateEnum
CREATE TYPE "AddOnPricingType" AS ENUM ('flat', 'per_night', 'per_person');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'ready', 'delivered', 'completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'cash', 'charge_to_site');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('pos', 'online', 'kiosk', 'portal', 'internal');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('pickup', 'curbside', 'delivery', 'table_service');

-- CreateEnum
CREATE TYPE "ChannelInventoryMode" AS ENUM ('shared', 'split');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('percentage', 'flat');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('active', 'fulfilled', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "WaitlistType" AS ENUM ('regular', 'seasonal');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('season', 'weekend', 'holiday', 'event', 'demand');

-- CreateEnum
CREATE TYPE "PricingStackMode" AS ENUM ('additive', 'max', 'override');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('percent', 'flat');

-- CreateEnum
CREATE TYPE "DepositStrategy" AS ENUM ('first_night', 'percent', 'fixed');

-- CreateEnum
CREATE TYPE "DepositApplyTo" AS ENUM ('lodging_only', 'lodging_plus_fees');

-- CreateEnum
CREATE TYPE "DepositDueTiming" AS ENUM ('at_booking', 'before_arrival');

-- CreateEnum
CREATE TYPE "BackoffStrategy" AS ENUM ('linear', 'exp');

-- CreateEnum
CREATE TYPE "UpsellPriceType" AS ENUM ('flat', 'per_night', 'per_guest', 'per_site');

-- CreateEnum
CREATE TYPE "UpsellChargeType" AS ENUM ('pay_now', 'add_to_reservation');

-- CreateEnum
CREATE TYPE "UpsellStatus" AS ENUM ('pending_charge', 'charged', 'canceled');

-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('pending', 'inflight', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "region" TEXT,
    "ownershipRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestEquipment" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "length" INTEGER,
    "plateNumber" TEXT,
    "plateState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampgroundMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampgroundMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT,
    "contactEmail" TEXT,
    "path" TEXT,
    "userAgent" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "roleFilter" TEXT,
    "pinnedIds" TEXT[],
    "recentIds" TEXT[],
    "rawContext" JSONB,
    "status" "SupportReportStatus" NOT NULL DEFAULT 'new',
    "assigneeId" TEXT,
    "authorId" TEXT,
    "campgroundId" TEXT,

    CONSTRAINT "SupportReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteClass" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultRate" INTEGER NOT NULL DEFAULT 0,
    "siteType" "SiteType" NOT NULL,
    "maxOccupancy" INTEGER NOT NULL,
    "rigMaxLength" INTEGER,
    "hookupsPower" BOOLEAN NOT NULL DEFAULT false,
    "hookupsWater" BOOLEAN NOT NULL DEFAULT false,
    "hookupsSewer" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "glCode" TEXT,
    "clientAccount" TEXT,
    "minNights" INTEGER,
    "maxNights" INTEGER,
    "petFriendly" BOOLEAN NOT NULL DEFAULT true,
    "accessible" BOOLEAN NOT NULL DEFAULT false,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoAttributions" JSONB,
    "policyVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "organizationId" TEXT,
    "reservationId" TEXT,
    "siteId" TEXT,
    "siteClassId" TEXT,
    "promotionId" TEXT,
    "imageId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventName" "AnalyticsEventName" NOT NULL,
    "page" TEXT,
    "referrer" TEXT,
    "referrerUrl" TEXT,
    "deviceType" TEXT,
    "region" TEXT,
    "abVariantId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDailyAggregate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "organizationId" TEXT,
    "eventName" "AnalyticsEventName" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "uniqueSessions" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsDailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbTest" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "organizationId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AbTestStatus" NOT NULL DEFAULT 'draft',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbVariant" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbEnrollment" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "campgroundId" TEXT,
    "organizationId" TEXT,
    "sessionId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "billingEmail" TEXT,
    "billingName" TEXT,
    "billingAddress1" TEXT,
    "billingAddress2" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campground" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "externalUrl" TEXT,
    "nonBookableReason" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(12,8),
    "longitude" DECIMAL(12,8),
    "timezone" TEXT DEFAULT 'UTC',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "dataSource" TEXT,
    "dataSourceId" TEXT,
    "dataSourceUpdatedAt" TIMESTAMP(3),
    "dataImportNotes" TEXT,
    "provenance" JSONB,
    "gaMeasurementId" TEXT,
    "metaPixelId" TEXT,
    "aiSuggestionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiOpenaiApiKey" TEXT,
    "npsAutoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "npsSendHour" INTEGER DEFAULT 7,
    "npsTemplateId" TEXT,
    "npsSchedule" JSONB DEFAULT '[]',
    "description" TEXT,
    "tagline" TEXT,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photosMeta" JSONB,
    "heroImageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "amenitySummary" JSONB,
    "importedAt" TIMESTAMP(3),
    "seasonStart" TIMESTAMP(3),
    "seasonEnd" TIMESTAMP(3),
    "checkInTime" TEXT DEFAULT '15:00',
    "checkOutTime" TEXT DEFAULT '11:00',
    "parkTimeZone" TEXT,
    "slaMinutes" INTEGER DEFAULT 30,
    "senderDomain" TEXT,
    "senderDomainStatus" TEXT,
    "senderDomainCheckedAt" TIMESTAMP(3),
    "senderDomainDmarc" TEXT,
    "senderDomainSpf" TEXT,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "routingAssigneeId" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "brandingNote" TEXT,
    "secondaryColor" TEXT,
    "buttonColor" TEXT,
    "brandFont" TEXT,
    "emailHeader" TEXT,
    "receiptFooter" TEXT,
    "taxState" DECIMAL(10,4),
    "taxLocal" DECIMAL(10,4),
    "depositRule" TEXT,
    "depositPercentage" INTEGER,
    "depositConfig" JSONB,
    "defaultDepositPolicyId" TEXT,
    "cancellationPolicyType" TEXT,
    "cancellationWindowHours" INTEGER,
    "cancellationFeeType" TEXT,
    "cancellationFeeFlatCents" INTEGER,
    "cancellationFeePercent" INTEGER,
    "cancellationNotes" TEXT,
    "storeOpenHour" INTEGER,
    "storeCloseHour" INTEGER,
    "orderWebhookUrl" TEXT,
    "stripeAccountId" TEXT,
    "applicationFeeFlatCents" INTEGER DEFAULT 300,
    "billingPlan" "BillingPlan" NOT NULL DEFAULT 'ota_only',
    "perBookingFeeCents" INTEGER DEFAULT 300,
    "monthlyFeeCents" INTEGER,
    "feeMode" "PaymentFeeMode" NOT NULL DEFAULT 'absorb',
    "stripeCapabilities" JSONB,
    "stripeCapabilitiesFetchedAt" TIMESTAMP(3),
    "reviewScore" DECIMAL(4,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewSources" JSONB,
    "reviewsUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campground_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "campgroundId" TEXT,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB,
    "subscription" JSONB,
    "expirationTime" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "FormTemplateType" NOT NULL DEFAULT 'custom',
    "description" TEXT,
    "fields" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT,
    "status" "FormSubmissionStatus" NOT NULL DEFAULT 'pending',
    "responses" JSONB,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "html" TEXT NOT NULL,
    "textBody" TEXT,
    "channel" "ChannelType" NOT NULL DEFAULT 'email',
    "templateId" TEXT,
    "audienceJson" JSONB,
    "suggestedReason" TEXT,
    "variables" JSONB,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "guestId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "channel" "ChannelType" NOT NULL DEFAULT 'email',
    "status" "CampaignSendStatus" NOT NULL DEFAULT 'queued',
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTemplate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL DEFAULT 'email',
    "category" TEXT DEFAULT 'general',
    "subject" TEXT,
    "html" TEXT,
    "textBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TaxRuleType" NOT NULL,
    "rate" DECIMAL(10,4),
    "minNights" INTEGER,
    "maxNights" INTEGER,
    "requiresWaiver" BOOLEAN NOT NULL DEFAULT false,
    "waiverText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'draft',
    "category" "SocialContentCategory",
    "scheduledFor" TIMESTAMP(3),
    "publishedFor" TIMESTAMP(3),
    "caption" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imagePrompt" TEXT,
    "notes" TEXT,
    "templateId" TEXT,
    "assetUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ideaParkingLot" BOOLEAN NOT NULL DEFAULT false,
    "suggestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTemplate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "category" "SocialContentCategory",
    "style" "SocialTemplateStyle",
    "defaultCaption" TEXT,
    "captionFillIns" TEXT,
    "imageGuidance" TEXT,
    "hashtagSet" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bestTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialContentAsset" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SocialAssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSuggestion" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "type" "SocialSuggestionType" NOT NULL,
    "status" "SocialSuggestionStatus" NOT NULL DEFAULT 'new',
    "message" TEXT NOT NULL,
    "reason" JSONB,
    "category" "SocialContentCategory",
    "platform" "SocialPlatform",
    "proposedDate" TIMESTAMP(3),
    "opportunityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialWeeklyIdea" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "generatedFor" TIMESTAMP(3) NOT NULL,
    "ideas" JSONB NOT NULL,
    "cadence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialWeeklyIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialStrategy" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "annual" BOOLEAN NOT NULL DEFAULT false,
    "plan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialOpportunityAlert" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "category" "SocialAlertCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialOpportunityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPerformanceInput" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "postId" TEXT,
    "likes" INTEGER,
    "reach" INTEGER,
    "comments" INTEGER,
    "saves" INTEGER,
    "shares" INTEGER,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPerformanceInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalRate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "name" TEXT NOT NULL,
    "rateType" "RateType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "minNights" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentSchedule" "PaymentSchedule" NOT NULL DEFAULT 'single',
    "pricingStructure" "PricingStructure" NOT NULL DEFAULT 'per_night',
    "offseasonInterval" INTEGER,
    "offseasonAmount" INTEGER,
    "prorateExcess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonalRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "name" TEXT NOT NULL,
    "siteNumber" TEXT NOT NULL,
    "siteType" "SiteType" NOT NULL,
    "maxOccupancy" INTEGER NOT NULL,
    "rigMaxLength" INTEGER,
    "hookupsPower" BOOLEAN NOT NULL DEFAULT false,
    "powerAmps" INTEGER,
    "hookupsWater" BOOLEAN NOT NULL DEFAULT false,
    "hookupsSewer" BOOLEAN NOT NULL DEFAULT false,
    "petFriendly" BOOLEAN NOT NULL DEFAULT true,
    "accessible" BOOLEAN NOT NULL DEFAULT false,
    "minNights" INTEGER,
    "maxNights" INTEGER,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoAttributions" JSONB,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vibeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT,
    "latitude" DECIMAL(12,8),
    "longitude" DECIMAL(12,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "housekeepingStatus" TEXT NOT NULL DEFAULT 'clean',

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteHold" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "primaryFirstName" TEXT NOT NULL,
    "primaryLastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalized" TEXT,
    "phone" TEXT,
    "phoneNormalized" TEXT,
    "preferredContact" TEXT,
    "preferredLanguage" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "rigType" TEXT,
    "rigLength" INTEGER,
    "vehiclePlate" TEXT,
    "vehicleState" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vip" BOOLEAN NOT NULL DEFAULT false,
    "leadSource" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "repeatStays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "preferences" JSONB,
    "insights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProfile" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestAccount" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "magicLinkToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "balanceAmount" INTEGER NOT NULL DEFAULT 0,
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "depositDueDate" TIMESTAMP(3),
    "pricingRuleVersion" TEXT,
    "depositPolicyVersion" TEXT,
    "nextAutoCollectAttemptAt" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "baseSubtotal" INTEGER NOT NULL DEFAULT 0,
    "feesAmount" INTEGER NOT NULL DEFAULT 0,
    "taxesAmount" INTEGER NOT NULL DEFAULT 0,
    "discountsAmount" INTEGER NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "source" TEXT,
    "policyVersion" TEXT,
    "checkInWindowStart" TEXT,
    "checkInWindowEnd" TEXT,
    "vehiclePlate" TEXT,
    "vehicleState" TEXT,
    "rigType" TEXT,
    "rigLength" INTEGER,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "notes" TEXT,
    "stayType" "StayType" NOT NULL DEFAULT 'standard',
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "taxWaiverSigned" BOOLEAN NOT NULL DEFAULT false,
    "taxWaiverDate" TIMESTAMP(3),
    "seasonalRateId" TEXT,
    "leadTimeDays" INTEGER,
    "bookedAt" TIMESTAMP(3),
    "additionalGuests" JSONB,
    "childrenDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'open',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "isBlocking" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "label" TEXT,
    "ruleType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "percentAdjust" DECIMAL(6,4),
    "flatAdjust" INTEGER,
    "minNights" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'card',
    "direction" TEXT NOT NULL DEFAULT 'charge',
    "note" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeBalanceTransactionId" TEXT,
    "stripePayoutId" TEXT,
    "applicationFeeCents" INTEGER,
    "stripeFeeCents" INTEGER,
    "methodType" TEXT,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepeatCharge" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepeatCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT,
    "glCode" TEXT,
    "account" TEXT,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'debit',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "stripePayoutId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "feeCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "arrivalDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "statementDescriptor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutLine" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "description" TEXT,
    "reservationId" TEXT,
    "paymentIntentId" TEXT,
    "chargeId" TEXT,
    "balanceTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT,
    "payoutId" TEXT,
    "stripeDisputeId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "reason" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'needs_response',
    "evidenceDueBy" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'activity',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "location" TEXT,
    "capacity" INTEGER,
    "currentSignups" INTEGER NOT NULL DEFAULT 0,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "isGuestOnly" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurrenceEndDate" TIMESTAMP(3),
    "recurrenceDays" INTEGER[],
    "parentEventId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "sku" TEXT,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "glCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOnService" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "pricingType" "AddOnPricingType" NOT NULL DEFAULT 'flat',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "glCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AddOnService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrder" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT,
    "siteNumber" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'card',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "addOnId" TEXT,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlackoutDate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackoutDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL DEFAULT 'percentage',
    "value" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "guestId" TEXT,
    "siteId" TEXT,
    "siteTypeId" TEXT,
    "arrivalDate" TIMESTAMP(3),
    "departureDate" TIMESTAMP(3),
    "status" "WaitlistStatus" NOT NULL DEFAULT 'active',
    "type" "WaitlistType" NOT NULL DEFAULT 'regular',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3),
    "notifiedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalConversation" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "chainHash" TEXT NOT NULL DEFAULT '',
    "prevHash" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "retentionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditExport" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "recordCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacySetting" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "redactPII" BOOLEAN NOT NULL DEFAULT true,
    "consentRequired" BOOLEAN NOT NULL DEFAULT true,
    "backupRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "keyRotationDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "method" "ConsentMethod" NOT NULL DEFAULT 'digital',
    "purpose" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiiFieldTag" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "classification" "PiiClassification" NOT NULL,
    "redactionMode" "RedactionMode" NOT NULL DEFAULT 'mask',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiiFieldTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalPolicy" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "approverRoles" "UserRole"[],
    "rationale" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "action" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "resource" TEXT,
    "targetId" TEXT,
    "payload" JSONB,
    "justification" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionRule" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "role" "UserRole" NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fields" TEXT[],
    "effect" "PermissionEffect" NOT NULL DEFAULT 'allow',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'scheduled',

    CONSTRAINT "ActivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityBooking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "reservationId" TEXT,
    "quantity" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipType" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MembershipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestMembership" (
    "id" TEXT NOT NULL,
    "membershipTypeId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchaseAmount" INTEGER NOT NULL,

    CONSTRAINT "GuestMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalTask" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "organizationId" TEXT,
    "guestId" TEXT,
    "reservationId" TEXT,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "preview" TEXT,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "toAddress" TEXT,
    "fromAddress" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "bodyHtml" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "auditLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationPlaybook" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "channel" TEXT,
    "offsetMinutes" INTEGER,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "throttlePerMinute" INTEGER,
    "routingAssigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationPlaybookJob" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationPlaybookJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtaChannel" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disabled',
    "rateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "defaultStatus" TEXT NOT NULL DEFAULT 'confirmed',
    "sendEmailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "ignoreSiteRestrictions" BOOLEAN NOT NULL DEFAULT false,
    "ignoreCategoryRestrictions" BOOLEAN NOT NULL DEFAULT false,
    "feeMode" TEXT NOT NULL DEFAULT 'absorb',
    "webhookSecret" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtaChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtaListingMapping" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "siteId" TEXT,
    "siteClassId" TEXT,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'mapped',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "icalToken" TEXT,
    "icalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtaListingMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtaSyncLog" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtaSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtaReservationImport" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "externalReservationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtaReservationImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpsSurvey" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "question" TEXT,
    "status" "NpsSurveyStatus" NOT NULL DEFAULT 'draft',
    "channels" TEXT[] DEFAULT ARRAY['inapp', 'email']::TEXT[],
    "locales" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "cooldownDays" INTEGER,
    "samplingPercent" INTEGER,
    "metadata" JSONB,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NpsSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpsRule" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "percentage" INTEGER,
    "cooldownDays" INTEGER,
    "segmentJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NpsRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpsInvite" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "organizationId" TEXT,
    "guestId" TEXT,
    "reservationId" TEXT,
    "channel" TEXT NOT NULL,
    "status" "NpsInviteStatus" NOT NULL DEFAULT 'queued',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NpsInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpsResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "inviteId" TEXT,
    "campgroundId" TEXT NOT NULL,
    "guestId" TEXT,
    "reservationId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NpsResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NpsEvent" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NpsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRequest" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "organizationId" TEXT,
    "guestId" TEXT,
    "reservationId" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "organizationId" TEXT,
    "guestId" TEXT,
    "reservationId" TEXT,
    "requestId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" TEXT,
    "source" "ReviewSource" NOT NULL DEFAULT 'onsite',
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "exposure" "ReviewExposure" NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewModeration" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "status" "ReviewModerationStatus" NOT NULL DEFAULT 'pending',
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ReviewModeration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "guestId" TEXT,
    "ipHash" TEXT,
    "value" "ReviewVoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campgroundId" TEXT NOT NULL,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReply" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationSetting" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledRoles" "UserRole"[] DEFAULT ARRAY[]::"UserRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelDefinition" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minXp" INTEGER NOT NULL,
    "perks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpRule" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "category" "GamificationEventCategory" NOT NULL,
    "minXp" INTEGER NOT NULL DEFAULT 0,
    "maxXp" INTEGER NOT NULL DEFAULT 0,
    "defaultXp" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpBalance" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "category" "GamificationEventCategory" NOT NULL,
    "xp" INTEGER NOT NULL,
    "reason" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "eventKey" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "organizationId" TEXT,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "authType" TEXT,
    "credentials" JSONB,
    "settings" JSONB,
    "webhookSecret" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT,
    "provider" TEXT NOT NULL,
    "eventType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "signatureValid" BOOLEAN,
    "message" TEXT,
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationExportJob" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT,
    "campgroundId" TEXT,
    "type" TEXT NOT NULL,
    "resource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "location" TEXT,
    "requestedById" TEXT,
    "filters" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiClient" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "apiClientId" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "apiClientId" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "eventTypes" TEXT[],
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookEndpointId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "replayOfId" TEXT,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRuleV2" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "name" TEXT NOT NULL,
    "type" "PricingRuleType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "stackMode" "PricingStackMode" NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "adjustmentValue" DECIMAL(8,4) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dowMask" INTEGER[],
    "calendarRefId" TEXT,
    "demandBandId" TEXT,
    "minRateCap" INTEGER,
    "maxRateCap" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRuleV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandBand" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "thresholdPct" INTEGER NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "adjustmentValue" DECIMAL(8,4) NOT NULL,
    "priority" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositPolicy" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "name" TEXT NOT NULL,
    "strategy" "DepositStrategy" NOT NULL,
    "value" INTEGER NOT NULL,
    "minCap" INTEGER,
    "maxCap" INTEGER,
    "applyTo" "DepositApplyTo" NOT NULL,
    "dueTiming" "DepositDueTiming" NOT NULL,
    "retryPlanId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoCollectSchedule" (
    "id" TEXT NOT NULL,
    "depositPolicyId" TEXT NOT NULL,
    "attemptOffsetsDays" INTEGER[],
    "cutoffHoursBeforeArrival" INTEGER NOT NULL,
    "backoffStrategy" "BackoffStrategy" NOT NULL,
    "maxAttempts" INTEGER NOT NULL,
    "notifyTemplateIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoCollectSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellItem" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "siteClassId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceType" "UpsellPriceType" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "taxCode" TEXT,
    "inventoryTracking" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellBundle" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMode" TEXT NOT NULL,
    "bundlePrice" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellBundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UpsellBundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationUpsell" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "itemId" TEXT,
    "bundleId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceSnapshot" JSONB NOT NULL,
    "taxCodeSnapshot" TEXT,
    "chargeType" "UpsellChargeType" NOT NULL,
    "status" "UpsellStatus" NOT NULL DEFAULT 'pending_charge',
    "attemptNo" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationUpsell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "campgroundId" TEXT,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseJson" JSONB,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'pending',
    "resourceRef" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "GuestEquipment_guestId_idx" ON "GuestEquipment"("guestId");

-- CreateIndex
CREATE INDEX "CampgroundMembership_campgroundId_idx" ON "CampgroundMembership"("campgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "CampgroundMembership_userId_campgroundId_key" ON "CampgroundMembership"("userId", "campgroundId");

-- CreateIndex
CREATE INDEX "SiteClass_campgroundId_idx" ON "SiteClass"("campgroundId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_campgroundId_occurredAt_idx" ON "AnalyticsEvent"("campgroundId", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_organizationId_occurredAt_idx" ON "AnalyticsEvent"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_occurredAt_idx" ON "AnalyticsEvent"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteId_idx" ON "AnalyticsEvent"("siteId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_siteClassId_idx" ON "AnalyticsEvent"("siteClassId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_promotionId_idx" ON "AnalyticsEvent"("promotionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_abVariantId_idx" ON "AnalyticsEvent"("abVariantId");

-- CreateIndex
CREATE INDEX "AnalyticsDailyAggregate_organizationId_eventName_date_idx" ON "AnalyticsDailyAggregate"("organizationId", "eventName", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDailyAggregate_campgroundId_eventName_date_key" ON "AnalyticsDailyAggregate"("campgroundId", "eventName", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AbTest_key_key" ON "AbTest"("key");

-- CreateIndex
CREATE INDEX "AbTest_campgroundId_status_idx" ON "AbTest"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "AbTest_organizationId_status_idx" ON "AbTest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AbVariant_testId_idx" ON "AbVariant"("testId");

-- CreateIndex
CREATE INDEX "AbEnrollment_campgroundId_idx" ON "AbEnrollment"("campgroundId");

-- CreateIndex
CREATE INDEX "AbEnrollment_organizationId_idx" ON "AbEnrollment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AbEnrollment_testId_sessionId_key" ON "AbEnrollment"("testId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Campground_slug_key" ON "Campground"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Campground_defaultDepositPolicyId_key" ON "Campground"("defaultDepositPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "Campground_stripeAccountId_key" ON "Campground"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Campground_dataSource_dataSourceId_idx" ON "Campground"("dataSource", "dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_campgroundId_idx" ON "PushSubscription"("campgroundId");

-- CreateIndex
CREATE INDEX "Campaign_campgroundId_idx" ON "Campaign"("campgroundId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignSend_campaignId_idx" ON "CampaignSend"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignSend_campgroundId_idx" ON "CampaignSend"("campgroundId");

-- CreateIndex
CREATE INDEX "CampaignSend_guestId_idx" ON "CampaignSend"("guestId");

-- CreateIndex
CREATE INDEX "CampaignSend_status_idx" ON "CampaignSend"("status");

-- CreateIndex
CREATE INDEX "CampaignTemplate_campgroundId_idx" ON "CampaignTemplate"("campgroundId");

-- CreateIndex
CREATE INDEX "CampaignTemplate_channel_idx" ON "CampaignTemplate"("channel");

-- CreateIndex
CREATE INDEX "TaxRule_campgroundId_idx" ON "TaxRule"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialPost_campgroundId_idx" ON "SocialPost"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialPost_platform_status_idx" ON "SocialPost"("platform", "status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledFor_idx" ON "SocialPost"("scheduledFor");

-- CreateIndex
CREATE INDEX "SocialTemplate_campgroundId_idx" ON "SocialTemplate"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialContentAsset_campgroundId_idx" ON "SocialContentAsset"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialContentAsset_type_idx" ON "SocialContentAsset"("type");

-- CreateIndex
CREATE INDEX "SocialSuggestion_campgroundId_idx" ON "SocialSuggestion"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialSuggestion_type_status_idx" ON "SocialSuggestion"("type", "status");

-- CreateIndex
CREATE INDEX "SocialSuggestion_proposedDate_idx" ON "SocialSuggestion"("proposedDate");

-- CreateIndex
CREATE INDEX "SocialWeeklyIdea_generatedFor_idx" ON "SocialWeeklyIdea"("generatedFor");

-- CreateIndex
CREATE UNIQUE INDEX "SocialWeeklyIdea_campgroundId_generatedFor_key" ON "SocialWeeklyIdea"("campgroundId", "generatedFor");

-- CreateIndex
CREATE INDEX "SocialStrategy_campgroundId_month_idx" ON "SocialStrategy"("campgroundId", "month");

-- CreateIndex
CREATE INDEX "SocialOpportunityAlert_campgroundId_idx" ON "SocialOpportunityAlert"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialOpportunityAlert_category_idx" ON "SocialOpportunityAlert"("category");

-- CreateIndex
CREATE INDEX "SocialPerformanceInput_campgroundId_idx" ON "SocialPerformanceInput"("campgroundId");

-- CreateIndex
CREATE INDEX "SocialPerformanceInput_postId_idx" ON "SocialPerformanceInput"("postId");

-- CreateIndex
CREATE INDEX "SocialPerformanceInput_recordedAt_idx" ON "SocialPerformanceInput"("recordedAt");

-- CreateIndex
CREATE INDEX "SeasonalRate_campgroundId_idx" ON "SeasonalRate"("campgroundId");

-- CreateIndex
CREATE INDEX "SeasonalRate_siteClassId_idx" ON "SeasonalRate"("siteClassId");

-- CreateIndex
CREATE INDEX "Site_campgroundId_idx" ON "Site"("campgroundId");

-- CreateIndex
CREATE INDEX "Site_siteType_idx" ON "Site"("siteType");

-- CreateIndex
CREATE INDEX "Site_siteClassId_idx" ON "Site"("siteClassId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_campgroundId_name_key" ON "Site"("campgroundId", "name");

-- CreateIndex
CREATE INDEX "SiteHold_campgroundId_idx" ON "SiteHold"("campgroundId");

-- CreateIndex
CREATE INDEX "SiteHold_siteId_idx" ON "SiteHold"("siteId");

-- CreateIndex
CREATE INDEX "SiteHold_expiresAt_idx" ON "SiteHold"("expiresAt");

-- CreateIndex
CREATE INDEX "Guest_emailNormalized_idx" ON "Guest"("emailNormalized");

-- CreateIndex
CREATE INDEX "Guest_phoneNormalized_idx" ON "Guest"("phoneNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_email_key" ON "Guest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProfile_guestId_key" ON "LoyaltyProfile"("guestId");

-- CreateIndex
CREATE INDEX "LoyaltyProfile_guestId_idx" ON "LoyaltyProfile"("guestId");

-- CreateIndex
CREATE INDEX "PointsTransaction_profileId_idx" ON "PointsTransaction"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccount_guestId_key" ON "GuestAccount"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccount_email_key" ON "GuestAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccount_magicLinkToken_key" ON "GuestAccount"("magicLinkToken");

-- CreateIndex
CREATE INDEX "GuestAccount_email_idx" ON "GuestAccount"("email");

-- CreateIndex
CREATE INDEX "GuestAccount_magicLinkToken_idx" ON "GuestAccount"("magicLinkToken");

-- CreateIndex
CREATE INDEX "Reservation_campgroundId_idx" ON "Reservation"("campgroundId");

-- CreateIndex
CREATE INDEX "Reservation_siteId_idx" ON "Reservation"("siteId");

-- CreateIndex
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");

-- CreateIndex
CREATE INDEX "Reservation_seasonalRateId_idx" ON "Reservation"("seasonalRateId");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_campgroundId_idx" ON "MaintenanceTicket"("campgroundId");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_status_idx" ON "MaintenanceTicket"("status");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_dueDate_idx" ON "MaintenanceTicket"("dueDate");

-- CreateIndex
CREATE INDEX "MaintenanceTicket_assignedTo_idx" ON "MaintenanceTicket"("assignedTo");

-- CreateIndex
CREATE INDEX "PricingRule_campgroundId_idx" ON "PricingRule"("campgroundId");

-- CreateIndex
CREATE INDEX "PricingRule_siteClassId_idx" ON "PricingRule"("siteClassId");

-- CreateIndex
CREATE INDEX "Payment_campgroundId_idx" ON "Payment"("campgroundId");

-- CreateIndex
CREATE INDEX "Payment_reservationId_idx" ON "Payment"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_stripeChargeId_idx" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Payment_stripePayoutId_idx" ON "Payment"("stripePayoutId");

-- CreateIndex
CREATE INDEX "RepeatCharge_reservationId_idx" ON "RepeatCharge"("reservationId");

-- CreateIndex
CREATE INDEX "RepeatCharge_status_idx" ON "RepeatCharge"("status");

-- CreateIndex
CREATE INDEX "RepeatCharge_dueDate_idx" ON "RepeatCharge"("dueDate");

-- CreateIndex
CREATE INDEX "LedgerEntry_campgroundId_idx" ON "LedgerEntry"("campgroundId");

-- CreateIndex
CREATE INDEX "LedgerEntry_reservationId_idx" ON "LedgerEntry"("reservationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_glCode_idx" ON "LedgerEntry"("glCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripePayoutId_key" ON "Payout"("stripePayoutId");

-- CreateIndex
CREATE INDEX "Payout_campgroundId_idx" ON "Payout"("campgroundId");

-- CreateIndex
CREATE INDEX "Payout_stripeAccountId_idx" ON "Payout"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "PayoutLine_payoutId_idx" ON "PayoutLine"("payoutId");

-- CreateIndex
CREATE INDEX "PayoutLine_reservationId_idx" ON "PayoutLine"("reservationId");

-- CreateIndex
CREATE INDEX "PayoutLine_paymentIntentId_idx" ON "PayoutLine"("paymentIntentId");

-- CreateIndex
CREATE INDEX "PayoutLine_chargeId_idx" ON "PayoutLine"("chargeId");

-- CreateIndex
CREATE INDEX "PayoutLine_balanceTransactionId_idx" ON "PayoutLine"("balanceTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_stripeDisputeId_key" ON "Dispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "Dispute_campgroundId_idx" ON "Dispute"("campgroundId");

-- CreateIndex
CREATE INDEX "Dispute_reservationId_idx" ON "Dispute"("reservationId");

-- CreateIndex
CREATE INDEX "Dispute_payoutId_idx" ON "Dispute"("payoutId");

-- CreateIndex
CREATE INDEX "Dispute_stripeDisputeId_idx" ON "Dispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "Dispute_stripeChargeId_idx" ON "Dispute"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Dispute_stripePaymentIntentId_idx" ON "Dispute"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Event_campgroundId_idx" ON "Event"("campgroundId");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- CreateIndex
CREATE INDEX "ProductCategory_campgroundId_idx" ON "ProductCategory"("campgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_campgroundId_name_key" ON "ProductCategory"("campgroundId", "name");

-- CreateIndex
CREATE INDEX "Product_campgroundId_idx" ON "Product"("campgroundId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "AddOnService_campgroundId_idx" ON "AddOnService"("campgroundId");

-- CreateIndex
CREATE INDEX "StoreOrder_campgroundId_idx" ON "StoreOrder"("campgroundId");

-- CreateIndex
CREATE INDEX "StoreOrder_reservationId_idx" ON "StoreOrder"("reservationId");

-- CreateIndex
CREATE INDEX "StoreOrder_guestId_idx" ON "StoreOrder"("guestId");

-- CreateIndex
CREATE INDEX "StoreOrder_status_idx" ON "StoreOrder"("status");

-- CreateIndex
CREATE INDEX "StoreOrderItem_orderId_idx" ON "StoreOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "StoreOrderItem_productId_idx" ON "StoreOrderItem"("productId");

-- CreateIndex
CREATE INDEX "StoreOrderItem_addOnId_idx" ON "StoreOrderItem"("addOnId");

-- CreateIndex
CREATE INDEX "BlackoutDate_campgroundId_idx" ON "BlackoutDate"("campgroundId");

-- CreateIndex
CREATE INDEX "BlackoutDate_siteId_idx" ON "BlackoutDate"("siteId");

-- CreateIndex
CREATE INDEX "BlackoutDate_startDate_idx" ON "BlackoutDate"("startDate");

-- CreateIndex
CREATE INDEX "BlackoutDate_endDate_idx" ON "BlackoutDate"("endDate");

-- CreateIndex
CREATE INDEX "Promotion_campgroundId_idx" ON "Promotion"("campgroundId");

-- CreateIndex
CREATE INDEX "Promotion_code_idx" ON "Promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_campgroundId_code_key" ON "Promotion"("campgroundId", "code");

-- CreateIndex
CREATE INDEX "Message_campgroundId_idx" ON "Message"("campgroundId");

-- CreateIndex
CREATE INDEX "Message_reservationId_idx" ON "Message"("reservationId");

-- CreateIndex
CREATE INDEX "Message_guestId_idx" ON "Message"("guestId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_campgroundId_idx" ON "WaitlistEntry"("campgroundId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_guestId_idx" ON "WaitlistEntry"("guestId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_status_idx" ON "WaitlistEntry"("status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_type_idx" ON "WaitlistEntry"("type");

-- CreateIndex
CREATE INDEX "WaitlistEntry_arrivalDate_idx" ON "WaitlistEntry"("arrivalDate");

-- CreateIndex
CREATE INDEX "InternalConversation_campgroundId_idx" ON "InternalConversation"("campgroundId");

-- CreateIndex
CREATE INDEX "InternalConversationParticipant_userId_idx" ON "InternalConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalConversationParticipant_conversationId_userId_key" ON "InternalConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "InternalMessage_senderId_idx" ON "InternalMessage"("senderId");

-- CreateIndex
CREATE INDEX "InternalMessage_conversationId_idx" ON "InternalMessage"("conversationId");

-- CreateIndex
CREATE INDEX "InternalMessage_createdAt_idx" ON "InternalMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_campgroundId_createdAt_idx" ON "AuditLog"("campgroundId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_campgroundId_chainHash_idx" ON "AuditLog"("campgroundId", "chainHash");

-- CreateIndex
CREATE INDEX "AuditExport_campgroundId_createdAt_idx" ON "AuditExport"("campgroundId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditExport_requestedById_createdAt_idx" ON "AuditExport"("requestedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacySetting_campgroundId_key" ON "PrivacySetting"("campgroundId");

-- CreateIndex
CREATE INDEX "ConsentLog_campgroundId_grantedAt_idx" ON "ConsentLog"("campgroundId", "grantedAt");

-- CreateIndex
CREATE INDEX "PiiFieldTag_createdById_idx" ON "PiiFieldTag"("createdById");

-- CreateIndex
CREATE INDEX "PiiFieldTag_classification_idx" ON "PiiFieldTag"("classification");

-- CreateIndex
CREATE UNIQUE INDEX "PiiFieldTag_resource_field_key" ON "PiiFieldTag"("resource", "field");

-- CreateIndex
CREATE INDEX "ApprovalPolicy_campgroundId_action_idx" ON "ApprovalPolicy"("campgroundId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalPolicy_campgroundId_action_key" ON "ApprovalPolicy"("campgroundId", "action");

-- CreateIndex
CREATE INDEX "ApprovalRequest_campgroundId_status_idx" ON "ApprovalRequest"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "PermissionRule_resource_action_idx" ON "PermissionRule"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionRule_campgroundId_role_resource_action_key" ON "PermissionRule"("campgroundId", "role", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

-- CreateIndex
CREATE INDEX "InviteToken_userId_campgroundId_idx" ON "InviteToken"("userId", "campgroundId");

-- CreateIndex
CREATE INDEX "InviteToken_campgroundId_createdAt_idx" ON "InviteToken"("campgroundId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_campgroundId_createdAt_idx" ON "Communication"("campgroundId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_guestId_createdAt_idx" ON "Communication"("guestId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_reservationId_createdAt_idx" ON "Communication"("reservationId", "createdAt");

-- CreateIndex
CREATE INDEX "Communication_type_direction_idx" ON "Communication"("type", "direction");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_campgroundId_idx" ON "CommunicationTemplate"("campgroundId");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_status_idx" ON "CommunicationTemplate"("status");

-- CreateIndex
CREATE INDEX "CommunicationPlaybook_campgroundId_type_idx" ON "CommunicationPlaybook"("campgroundId", "type");

-- CreateIndex
CREATE INDEX "CommunicationPlaybook_templateId_idx" ON "CommunicationPlaybook"("templateId");

-- CreateIndex
CREATE INDEX "CommunicationPlaybookJob_playbookId_status_scheduledAt_idx" ON "CommunicationPlaybookJob"("playbookId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "CommunicationPlaybookJob_campgroundId_idx" ON "CommunicationPlaybookJob"("campgroundId");

-- CreateIndex
CREATE INDEX "CommunicationPlaybookJob_reservationId_idx" ON "CommunicationPlaybookJob"("reservationId");

-- CreateIndex
CREATE INDEX "OtaChannel_campgroundId_idx" ON "OtaChannel"("campgroundId");

-- CreateIndex
CREATE INDEX "OtaChannel_provider_campgroundId_idx" ON "OtaChannel"("provider", "campgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "OtaListingMapping_icalToken_key" ON "OtaListingMapping"("icalToken");

-- CreateIndex
CREATE INDEX "OtaListingMapping_channelId_siteId_idx" ON "OtaListingMapping"("channelId", "siteId");

-- CreateIndex
CREATE INDEX "OtaListingMapping_channelId_siteClassId_idx" ON "OtaListingMapping"("channelId", "siteClassId");

-- CreateIndex
CREATE UNIQUE INDEX "OtaListingMapping_channelId_externalId_key" ON "OtaListingMapping"("channelId", "externalId");

-- CreateIndex
CREATE INDEX "OtaSyncLog_channelId_createdAt_idx" ON "OtaSyncLog"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "OtaSyncLog_channelId_direction_eventType_idx" ON "OtaSyncLog"("channelId", "direction", "eventType");

-- CreateIndex
CREATE INDEX "OtaReservationImport_reservationId_idx" ON "OtaReservationImport"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "OtaReservationImport_channelId_externalReservationId_key" ON "OtaReservationImport"("channelId", "externalReservationId");

-- CreateIndex
CREATE INDEX "NpsSurvey_campgroundId_status_idx" ON "NpsSurvey"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "NpsRule_surveyId_isActive_idx" ON "NpsRule"("surveyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NpsInvite_token_key" ON "NpsInvite"("token");

-- CreateIndex
CREATE INDEX "NpsInvite_campgroundId_status_idx" ON "NpsInvite"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "NpsInvite_guestId_idx" ON "NpsInvite"("guestId");

-- CreateIndex
CREATE INDEX "NpsInvite_reservationId_idx" ON "NpsInvite"("reservationId");

-- CreateIndex
CREATE INDEX "NpsResponse_campgroundId_createdAt_idx" ON "NpsResponse"("campgroundId", "createdAt");

-- CreateIndex
CREATE INDEX "NpsResponse_surveyId_idx" ON "NpsResponse"("surveyId");

-- CreateIndex
CREATE INDEX "NpsResponse_guestId_idx" ON "NpsResponse"("guestId");

-- CreateIndex
CREATE INDEX "NpsResponse_reservationId_idx" ON "NpsResponse"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "NpsResponse_inviteId_key" ON "NpsResponse"("inviteId");

-- CreateIndex
CREATE INDEX "NpsEvent_inviteId_type_idx" ON "NpsEvent"("inviteId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRequest_token_key" ON "ReviewRequest"("token");

-- CreateIndex
CREATE INDEX "ReviewRequest_campgroundId_status_idx" ON "ReviewRequest"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "ReviewRequest_guestId_idx" ON "ReviewRequest"("guestId");

-- CreateIndex
CREATE INDEX "ReviewRequest_reservationId_idx" ON "ReviewRequest"("reservationId");

-- CreateIndex
CREATE INDEX "Review_campgroundId_status_createdAt_idx" ON "Review"("campgroundId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");

-- CreateIndex
CREATE INDEX "Review_reservationId_idx" ON "Review"("reservationId");

-- CreateIndex
CREATE INDEX "Review_source_idx" ON "Review"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Review_requestId_key" ON "Review"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewModeration_reviewId_key" ON "ReviewModeration"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewVote_reviewId_idx" ON "ReviewVote"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewVote_ipHash_idx" ON "ReviewVote"("ipHash");

-- CreateIndex
CREATE INDEX "ReviewVote_campgroundId_idx" ON "ReviewVote"("campgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_guestId_key" ON "ReviewVote"("reviewId", "guestId");

-- CreateIndex
CREATE INDEX "ReviewReply_reviewId_idx" ON "ReviewReply"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationSetting_campgroundId_key" ON "GamificationSetting"("campgroundId");

-- CreateIndex
CREATE INDEX "GamificationSetting_campgroundId_idx" ON "GamificationSetting"("campgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelDefinition_level_key" ON "LevelDefinition"("level");

-- CreateIndex
CREATE INDEX "XpRule_campgroundId_idx" ON "XpRule"("campgroundId");

-- CreateIndex
CREATE INDEX "XpRule_createdById_idx" ON "XpRule"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "XpRule_campgroundId_category_key" ON "XpRule"("campgroundId", "category");

-- CreateIndex
CREATE INDEX "XpBalance_campgroundId_idx" ON "XpBalance"("campgroundId");

-- CreateIndex
CREATE INDEX "XpBalance_userId_idx" ON "XpBalance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "XpBalance_campgroundId_userId_key" ON "XpBalance"("campgroundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "XpEvent_eventKey_key" ON "XpEvent"("eventKey");

-- CreateIndex
CREATE INDEX "XpEvent_campgroundId_idx" ON "XpEvent"("campgroundId");

-- CreateIndex
CREATE INDEX "XpEvent_userId_idx" ON "XpEvent"("userId");

-- CreateIndex
CREATE INDEX "XpEvent_campgroundId_userId_idx" ON "XpEvent"("campgroundId", "userId");

-- CreateIndex
CREATE INDEX "XpEvent_membershipId_idx" ON "XpEvent"("membershipId");

-- CreateIndex
CREATE INDEX "XpEvent_category_idx" ON "XpEvent"("category");

-- CreateIndex
CREATE INDEX "IntegrationConnection_campgroundId_type_provider_idx" ON "IntegrationConnection"("campgroundId", "type", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_campgroundId_type_provider_key" ON "IntegrationConnection"("campgroundId", "type", "provider");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_connectionId_occurredAt_idx" ON "IntegrationSyncLog"("connectionId", "occurredAt");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_status_idx" ON "IntegrationSyncLog"("status");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_provider_receivedAt_idx" ON "IntegrationWebhookEvent"("provider", "receivedAt");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_connectionId_receivedAt_idx" ON "IntegrationWebhookEvent"("connectionId", "receivedAt");

-- CreateIndex
CREATE INDEX "IntegrationExportJob_campgroundId_status_idx" ON "IntegrationExportJob"("campgroundId", "status");

-- CreateIndex
CREATE INDEX "IntegrationExportJob_connectionId_status_idx" ON "IntegrationExportJob"("connectionId", "status");

-- CreateIndex
CREATE INDEX "IntegrationExportJob_requestedById_idx" ON "IntegrationExportJob"("requestedById");

-- CreateIndex
CREATE UNIQUE INDEX "ApiClient_clientId_key" ON "ApiClient"("clientId");

-- CreateIndex
CREATE INDEX "ApiClient_campgroundId_idx" ON "ApiClient"("campgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_accessTokenHash_key" ON "ApiToken"("accessTokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_apiClientId_idx" ON "ApiToken"("apiClientId");

-- CreateIndex
CREATE INDEX "ApiToken_expiresAt_idx" ON "ApiToken"("expiresAt");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_campgroundId_isActive_idx" ON "WebhookEndpoint"("campgroundId", "isActive");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_apiClientId_idx" ON "WebhookEndpoint"("apiClientId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookEndpointId_createdAt_idx" ON "WebhookDelivery"("webhookEndpointId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventType_idx" ON "WebhookDelivery"("eventType");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AutoCollectSchedule_depositPolicyId_key" ON "AutoCollectSchedule"("depositPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- AddForeignKey
ALTER TABLE "GuestEquipment" ADD CONSTRAINT "GuestEquipment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampgroundMembership" ADD CONSTRAINT "CampgroundMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampgroundMembership" ADD CONSTRAINT "CampgroundMembership_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteClass" ADD CONSTRAINT "SiteClass_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_abVariantId_fkey" FOREIGN KEY ("abVariantId") REFERENCES "AbVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDailyAggregate" ADD CONSTRAINT "AnalyticsDailyAggregate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDailyAggregate" ADD CONSTRAINT "AnalyticsDailyAggregate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbTest" ADD CONSTRAINT "AbTest_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbTest" ADD CONSTRAINT "AbTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbVariant" ADD CONSTRAINT "AbVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AbTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbEnrollment" ADD CONSTRAINT "AbEnrollment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AbTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbEnrollment" ADD CONSTRAINT "AbEnrollment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "AbVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbEnrollment" ADD CONSTRAINT "AbEnrollment_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbEnrollment" ADD CONSTRAINT "AbEnrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campground" ADD CONSTRAINT "Campground_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campground" ADD CONSTRAINT "Campground_defaultDepositPolicyId_fkey" FOREIGN KEY ("defaultDepositPolicyId") REFERENCES "DepositPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CampaignTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTemplate" ADD CONSTRAINT "CampaignTemplate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxRule" ADD CONSTRAINT "TaxRule_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SocialTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "SocialSuggestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialTemplate" ADD CONSTRAINT "SocialTemplate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentAsset" ADD CONSTRAINT "SocialContentAsset_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentAsset" ADD CONSTRAINT "SocialContentAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSuggestion" ADD CONSTRAINT "SocialSuggestion_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialWeeklyIdea" ADD CONSTRAINT "SocialWeeklyIdea_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialStrategy" ADD CONSTRAINT "SocialStrategy_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialOpportunityAlert" ADD CONSTRAINT "SocialOpportunityAlert_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPerformanceInput" ADD CONSTRAINT "SocialPerformanceInput_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPerformanceInput" ADD CONSTRAINT "SocialPerformanceInput_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalRate" ADD CONSTRAINT "SeasonalRate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalRate" ADD CONSTRAINT "SeasonalRate_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteHold" ADD CONSTRAINT "SiteHold_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteHold" ADD CONSTRAINT "SiteHold_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProfile" ADD CONSTRAINT "LoyaltyProfile_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LoyaltyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestAccount" ADD CONSTRAINT "GuestAccount_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_seasonalRateId_fkey" FOREIGN KEY ("seasonalRateId") REFERENCES "SeasonalRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepeatCharge" ADD CONSTRAINT "RepeatCharge_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLine" ADD CONSTRAINT "PayoutLine_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLine" ADD CONSTRAINT "PayoutLine_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnService" ADD CONSTRAINT "AddOnService_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrderItem" ADD CONSTRAINT "StoreOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "StoreOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrderItem" ADD CONSTRAINT "StoreOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrderItem" ADD CONSTRAINT "StoreOrderItem_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOnService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_siteTypeId_fkey" FOREIGN KEY ("siteTypeId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalConversation" ADD CONSTRAINT "InternalConversation_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalConversationParticipant" ADD CONSTRAINT "InternalConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "InternalConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalConversationParticipant" ADD CONSTRAINT "InternalConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "InternalConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditExport" ADD CONSTRAINT "AuditExport_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditExport" ADD CONSTRAINT "AuditExport_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacySetting" ADD CONSTRAINT "PrivacySetting_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiiFieldTag" ADD CONSTRAINT "PiiFieldTag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalPolicy_campground_action" FOREIGN KEY ("campgroundId", "action") REFERENCES "ApprovalPolicy"("campgroundId", "action") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityBooking" ADD CONSTRAINT "ActivityBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityBooking" ADD CONSTRAINT "ActivityBooking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityBooking" ADD CONSTRAINT "ActivityBooking_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipType" ADD CONSTRAINT "MembershipType_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestMembership" ADD CONSTRAINT "GuestMembership_membershipTypeId_fkey" FOREIGN KEY ("membershipTypeId") REFERENCES "MembershipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestMembership" ADD CONSTRAINT "GuestMembership_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPlaybook" ADD CONSTRAINT "CommunicationPlaybook_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPlaybook" ADD CONSTRAINT "CommunicationPlaybook_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPlaybookJob" ADD CONSTRAINT "CommunicationPlaybookJob_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "CommunicationPlaybook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPlaybookJob" ADD CONSTRAINT "CommunicationPlaybookJob_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPlaybookJob" ADD CONSTRAINT "CommunicationPlaybookJob_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationPlaybookJob" ADD CONSTRAINT "CommunicationPlaybookJob_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaChannel" ADD CONSTRAINT "OtaChannel_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaListingMapping" ADD CONSTRAINT "OtaListingMapping_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "OtaChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaListingMapping" ADD CONSTRAINT "OtaListingMapping_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaListingMapping" ADD CONSTRAINT "OtaListingMapping_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaSyncLog" ADD CONSTRAINT "OtaSyncLog_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "OtaChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaReservationImport" ADD CONSTRAINT "OtaReservationImport_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "OtaChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaReservationImport" ADD CONSTRAINT "OtaReservationImport_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsSurvey" ADD CONSTRAINT "NpsSurvey_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsRule" ADD CONSTRAINT "NpsRule_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "NpsSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsInvite" ADD CONSTRAINT "NpsInvite_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "NpsSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsInvite" ADD CONSTRAINT "NpsInvite_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsInvite" ADD CONSTRAINT "NpsInvite_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsInvite" ADD CONSTRAINT "NpsInvite_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsResponse" ADD CONSTRAINT "NpsResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "NpsSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsResponse" ADD CONSTRAINT "NpsResponse_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "NpsInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsResponse" ADD CONSTRAINT "NpsResponse_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsResponse" ADD CONSTRAINT "NpsResponse_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsResponse" ADD CONSTRAINT "NpsResponse_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NpsEvent" ADD CONSTRAINT "NpsEvent_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "NpsInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReviewRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewModeration" ADD CONSTRAINT "ReviewModeration_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationSetting" ADD CONSTRAINT "GamificationSetting_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpRule" ADD CONSTRAINT "XpRule_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpRule" ADD CONSTRAINT "XpRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpBalance" ADD CONSTRAINT "XpBalance_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpBalance" ADD CONSTRAINT "XpBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "CampgroundMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookEvent" ADD CONSTRAINT "IntegrationWebhookEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationExportJob" ADD CONSTRAINT "IntegrationExportJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationExportJob" ADD CONSTRAINT "IntegrationExportJob_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationExportJob" ADD CONSTRAINT "IntegrationExportJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiClient" ADD CONSTRAINT "ApiClient_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "ApiClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "ApiClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRuleV2" ADD CONSTRAINT "PricingRuleV2_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRuleV2" ADD CONSTRAINT "PricingRuleV2_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandBand" ADD CONSTRAINT "DemandBand_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandBand" ADD CONSTRAINT "DemandBand_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositPolicy" ADD CONSTRAINT "DepositPolicy_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositPolicy" ADD CONSTRAINT "DepositPolicy_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCollectSchedule" ADD CONSTRAINT "AutoCollectSchedule_depositPolicyId_fkey" FOREIGN KEY ("depositPolicyId") REFERENCES "DepositPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellItem" ADD CONSTRAINT "UpsellItem_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellItem" ADD CONSTRAINT "UpsellItem_siteClassId_fkey" FOREIGN KEY ("siteClassId") REFERENCES "SiteClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellBundle" ADD CONSTRAINT "UpsellBundle_campgroundId_fkey" FOREIGN KEY ("campgroundId") REFERENCES "Campground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellBundleItem" ADD CONSTRAINT "UpsellBundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "UpsellBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellBundleItem" ADD CONSTRAINT "UpsellBundleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UpsellItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationUpsell" ADD CONSTRAINT "ReservationUpsell_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationUpsell" ADD CONSTRAINT "ReservationUpsell_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UpsellItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationUpsell" ADD CONSTRAINT "ReservationUpsell_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "UpsellBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

