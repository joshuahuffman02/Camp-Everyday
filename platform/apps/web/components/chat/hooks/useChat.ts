"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api-config";

interface ActionOption {
  id: string;
  label: string;
  variant?: "default" | "destructive" | "outline";
}

interface ActionRequired {
  type: "confirmation" | "form" | "selection";
  actionId: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
  options?: ActionOption[];
}

type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

type ToolResult = {
  toolCallId: string;
  result: unknown;
};

interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  actionRequired?: ActionRequired;
  createdAt: string;
}

interface SendMessageResponse {
  conversationId: string;
  messageId: string;
  role: "assistant";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  actionRequired?: ActionRequired;
  createdAt: string;
}

interface ExecuteActionResponse {
  success: boolean;
  message: string;
  result?: unknown;
  error?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const isToolCall = (value: unknown): value is ToolCall =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  isRecord(value.args);

const isToolResult = (value: unknown): value is ToolResult =>
  isRecord(value) && typeof value.toolCallId === "string";

const isActionRequired = (value: unknown): value is ActionRequired => {
  if (!isRecord(value)) return false;
  const type = value.type;
  if (type !== "confirmation" && type !== "form" && type !== "selection") return false;
  return typeof value.actionId === "string" && typeof value.title === "string" && typeof value.description === "string";
};

const toSendMessageResponse = (value: unknown): SendMessageResponse => {
  if (!isRecord(value)) {
    throw new Error("Invalid chat response");
  }
  const conversationId = getString(value.conversationId);
  const messageId = getString(value.messageId);
  const content = getString(value.content);
  if (!conversationId || !messageId || !content) {
    throw new Error("Invalid chat response");
  }
  return {
    conversationId,
    messageId,
    role: "assistant",
    content,
    toolCalls: Array.isArray(value.toolCalls) ? value.toolCalls.filter(isToolCall) : undefined,
    toolResults: Array.isArray(value.toolResults) ? value.toolResults.filter(isToolResult) : undefined,
    actionRequired: isActionRequired(value.actionRequired) ? value.actionRequired : undefined,
    createdAt: getString(value.createdAt) ?? new Date().toISOString(),
  };
};

const toExecuteActionResponse = (value: unknown): ExecuteActionResponse => {
  if (!isRecord(value)) {
    return { success: false, message: "Action failed", error: "Invalid response" };
  }
  return {
    success: typeof value.success === "boolean" ? value.success : false,
    message: getString(value.message) ?? "Action completed",
    result: value.result,
    error: getString(value.error),
  };
};

interface UseChatOptions {
  campgroundId: string;
  isGuest: boolean;
  guestId?: string;
  authToken?: string | null;
}

export function useChat({ campgroundId, isGuest, guestId, authToken }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    if (guestId) {
      headers["x-guest-id"] = guestId;
    }
    return headers;
  }, [authToken, guestId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<SendMessageResponse> => {
      const endpoint = isGuest
        ? `${API_BASE}/chat/portal/${campgroundId}/message`
        : `${API_BASE}/chat/campgrounds/${campgroundId}/message`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          conversationId,
          message,
          context: {},
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to send message");
      }

      const data: unknown = await res.json();
      return toSendMessageResponse(data);
    },
    onMutate: (message) => {
      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        conversationId: conversationId || "",
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);

      const assistantMessage: ChatMessage = {
        id: data.messageId,
        conversationId: data.conversationId,
        role: "assistant",
        content: data.content,
        toolCalls: data.toolCalls,
        toolResults: data.toolResults,
        actionRequired: data.actionRequired,
        createdAt: data.createdAt,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        conversationId: conversationId || "",
        role: "system",
        content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    },
  });

  const executeActionMutation = useMutation({
    mutationFn: async ({
      actionId,
      optionId,
    }: {
      actionId: string;
      optionId: string;
    }): Promise<ExecuteActionResponse> => {
      if (!conversationId) {
        throw new Error("No active conversation");
      }

      const endpoint = isGuest
        ? `${API_BASE}/chat/portal/${campgroundId}/action`
        : `${API_BASE}/chat/campgrounds/${campgroundId}/action`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          conversationId,
          actionId,
          selectedOption: optionId,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to execute action");
      }

      const data: unknown = await res.json();
      return toExecuteActionResponse(data);
    },
    onSuccess: (data) => {
      // Add result as assistant message
      const resultMessage: ChatMessage = {
        id: `result_${Date.now()}`,
        conversationId: conversationId || "",
        role: "assistant",
        content: data.message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, resultMessage]);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        conversationId: conversationId || "",
        role: "system",
        content: error instanceof Error ? error.message : "Failed to execute action",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      sendMessageMutation.mutate(message);
    },
    [sendMessageMutation]
  );

  const executeAction = useCallback(
    (actionId: string, optionId: string) => {
      executeActionMutation.mutate({ actionId, optionId });
    },
    [executeActionMutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    conversationId,
    isTyping,
    isSending: sendMessageMutation.isPending,
    isExecuting: executeActionMutation.isPending,
    sendMessage,
    executeAction,
    clearMessages,
  };
}
