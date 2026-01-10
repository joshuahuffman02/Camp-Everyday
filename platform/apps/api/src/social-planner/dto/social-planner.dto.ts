export interface CreatePostDto {
    campgroundId: string;
    title: string;
    platform: string;
    status?: string;
    category?: string;
    scheduledFor?: Date | string | null;
    publishedFor?: Date | string | null;
    caption?: string | null;
    hashtags?: string[];
    imagePrompt?: string | null;
    notes?: string | null;
    templateId?: string | null;
    assetUrls?: string[];
    tags?: string[];
    ideaParkingLot?: boolean;
    suggestionId?: string | null;
}

export type UpdatePostDto = Partial<CreatePostDto>;

export interface CreateTemplateDto {
    campgroundId: string;
    name: string;
    summary?: string | null;
    category?: string | null;
    style?: string | null;
    defaultCaption?: string | null;
    captionFillIns?: string | null;
    imageGuidance?: string | null;
    hashtagSet?: string[];
    bestTime?: string | null;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto>;

export interface CreateAssetDto {
    campgroundId: string;
    title: string;
    type: string;
    url: string;
    tags?: string[];
    notes?: string | null;
    uploadedById?: string | null;
}

export type UpdateAssetDto = Partial<CreateAssetDto>;

export interface CreateSuggestionDto {
    campgroundId: string;
    type: string;
    message: string;
    status?: string;
    category?: string | null;
    platform?: string | null;
    proposedDate?: Date | string | null;
    opportunityAt?: Date | string | null;
    postId?: string | null;
    reason?: Record<string, unknown>;
}

export interface UpdateSuggestionStatusDto {
    status: string;
    postId?: string | null;
}

export interface CreateStrategyDto {
    campgroundId: string;
    month: Date | string;
    annual?: boolean;
    plan: Record<string, unknown>;
}

export interface CreateAlertDto {
    campgroundId: string;
    category: string;
    message: string;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
}

export interface PerformanceInputDto {
    campgroundId: string;
    postId?: string | null;
    likes?: number | null;
    reach?: number | null;
    comments?: number | null;
    saves?: number | null;
    shares?: number | null;
    notes?: string | null;
    recordedAt?: Date | string | null;
}

