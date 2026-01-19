export type ChatAccent = "guest" | "staff" | "public" | "support" | "partner";

export interface ChatToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ChatToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ChatAttachment {
  name: string;
  contentType: string;
  size: number;
  url?: string;
  downloadUrl?: string;
  storageKey?: string;
}

export interface ChatActionOption {
  id: string;
  label: string;
  variant?: "default" | "destructive" | "outline";
}

export interface ChatActionRequired {
  type: "confirmation" | "form" | "selection";
  actionId: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
  options?: ChatActionOption[];
}

export interface ChatRecommendation {
  siteName?: string;
  siteClassName: string;
  reasons: string[];
}

export interface HelpArticleLink {
  title: string;
  url: string;
}

export interface UnifiedChatMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolCalls?: ChatToolCall[];
  toolResults?: ChatToolResult[];
  attachments?: ChatAttachment[];
  actionRequired?: ChatActionRequired;
  recommendations?: ChatRecommendation[];
  clarifyingQuestions?: string[];
  helpArticles?: HelpArticleLink[];
  showTicketPrompt?: boolean;
  createdAt?: string;
}

export interface ChatConversationSummary {
  id: string;
  title?: string | null;
  updatedAt?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
}
