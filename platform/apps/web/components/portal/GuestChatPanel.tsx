"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";

type Message = {
    id: string;
    senderType: "guest" | "staff";
    content: string;
    createdAt: string;
    guest: {
        id: string;
        primaryFirstName: string;
        primaryLastName: string;
    };
};

interface GuestChatPanelProps {
    reservationId: string;
    token: string;
}

// Polling interval in milliseconds (3 seconds)
const POLL_INTERVAL = 3000;

export function GuestChatPanel({ reservationId, token }: GuestChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    const loadMessages = useCallback(async (isPolling = false) => {
        try {
            const data = await apiClient.getPortalMessages(reservationId, token);

            // Check if there are new messages (for polling)
            const newLastId = data.length > 0 ? data[data.length - 1].id : null;
            const hasNewMessages = newLastId !== lastMessageIdRef.current;

            setMessages(data);
            lastMessageIdRef.current = newLastId;

            // Only auto-scroll on new messages during polling, not on initial load scroll
            if (isPolling && hasNewMessages) {
                scrollToBottom();
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
        }
    }, [reservationId, token, scrollToBottom]);

    // Initial load
    useEffect(() => {
        loadMessages(false);
    }, [loadMessages]);

    // Polling for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            loadMessages(true);
        }, POLL_INTERVAL);

        return () => clearInterval(interval);
    }, [loadMessages]);

    // Scroll to bottom on initial messages load
    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom("instant");
        }
    }, [loading, messages.length, scrollToBottom]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await apiClient.sendPortalMessage(reservationId, newMessage.trim(), token);
            setNewMessage("");
            // Reload messages to get the new one
            await loadMessages();
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-10 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Messages
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No messages yet</p>
                            <p className="text-sm">Send a message to the front desk</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderType === "guest" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.senderType === "guest"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <p
                                        className={`text-[10px] mt-1 ${msg.senderType === "guest"
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                                        {msg.senderType === "staff" && " • Front Desk"}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2 pt-3 border-t">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
