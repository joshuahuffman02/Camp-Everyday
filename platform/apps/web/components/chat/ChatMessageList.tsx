"use client";

import type { ReactNode, RefObject } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatAccent, UnifiedChatMessage } from "./types";

type ChatMessageListProps = {
  messages: UnifiedChatMessage[];
  isTyping?: boolean;
  accent?: ChatAccent;
  onActionSelect?: (actionId: string, optionId: string) => void;
  onQuickReply?: (prompt: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, value: "up" | "down") => void;
  feedbackById?: Record<string, "up" | "down">;
  onTicketAction?: () => void;
  ticketHref?: string;
  emptyState?: ReactNode;
  bottomRef?: RefObject<HTMLDivElement>;
  containerRef?: RefObject<HTMLDivElement>;
  onScroll?: () => void;
};

export function ChatMessageList({
  messages,
  isTyping = false,
  accent = "staff",
  onActionSelect,
  onQuickReply,
  onEditMessage,
  onRegenerate,
  onFeedback,
  feedbackById,
  onTicketAction,
  ticketHref,
  emptyState,
  bottomRef,
  containerRef,
  onScroll,
}: ChatMessageListProps) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
      data-testid="chat-message-list"
    >
      {messages.length === 0 && emptyState}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          accent={accent}
          onActionSelect={onActionSelect}
          onQuickReply={onQuickReply}
          onEditMessage={onEditMessage}
          onRegenerate={onRegenerate}
          onFeedback={onFeedback}
          feedback={feedbackById?.[message.id]}
          onTicketAction={onTicketAction}
          ticketHref={ticketHref}
          {...message}
        />
      ))}
      {isTyping && (
        <ChatMessage
          id="typing"
          role="assistant"
          content=""
          isLoading={true}
          accent={accent}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
