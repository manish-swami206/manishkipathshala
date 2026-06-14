"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSupportTickets,
  useSupportTicket,
  useCreateSupportTicket,
  useSendSupportTicketMessage,
  useDeleteSupportTicket,
} from "@/lib/api";
import type { SupportTicketListItem, SupportTicketDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  MessageSquare,
  Plus,
  Trash2,
  User,
  Headphones,
  Loader2,
  ChevronLeft,
  Clock,
  AlertCircle,
  Inbox,
} from "lucide-react";

export default function Support() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets, isLoading: loadingTickets } = useListSupportTickets();
  const { data: ticketDetail, isLoading: loadingDetail } = useSupportTicket(
    selectedId ?? 0,
    {
      query: { enabled: selectedId !== null },
    },
  );
  const createMutation = useCreateSupportTicket();
  const sendMutation = useSendSupportTicketMessage(selectedId ?? 0);
  const deleteMutation = useDeleteSupportTicket();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketDetail?.messages, sendMutation.isPending]);

  const refreshTickets = () => {
    queryClient.invalidateQueries({ queryKey: ["support", "tickets", "list"] });
  };

  useEffect(() => {
    if (tickets && tickets.length > 0 && !selectedId) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedId || sendMutation.isPending) return;

    const proceed = await requireAuth(() => true);
    if (!proceed) return;

    const msg = input;
    setInput("");
    sendMutation.mutate(
      { message: msg },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["support", "tickets", "detail", selectedId],
          });
          refreshTickets();
        },
        onError: () => {
          toast({ title: "Failed to send message", variant: "destructive" });
        },
      },
    );
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim() || createMutation.isPending)
      return;

    const proceed = await requireAuth(() => true);
    if (!proceed) return;

    createMutation.mutate(
      { title: newTitle, message: newMessage },
      {
        onSuccess: (ticket) => {
          setShowNewTicket(false);
          setNewTitle("");
          setNewMessage("");
          setSelectedId(ticket.id);
          refreshTickets();
          toast({ title: "Support ticket created" });
        },
        onError: () => {
          toast({ title: "Failed to create ticket", variant: "destructive" });
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
        refreshTickets();
        toast({ title: "Ticket deleted" });
      },
      onError: () => {
        toast({ title: "Failed to delete ticket", variant: "destructive" });
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-500 border-gray-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] max-w-6xl mx-auto w-full p-0 md:p-4">
      <div className="bg-card border md:rounded-2xl shadow-sm flex flex-col md:flex-row h-full overflow-hidden">
        {/* Conversation List */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col shrink-0">
          <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">Support</h2>
            </div>
            <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Support Ticket</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Subject
                    </label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Brief title of your query..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Message
                    </label>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Describe your query in detail..."
                      rows={4}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Submit Ticket
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingTickets ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : !tickets || tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
                <Inbox className="w-10 h-10 text-muted-foreground/40" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">
                    No conversations
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create a new ticket to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <Button
                    key={ticket.id}
                    variant="ghost"
                    onClick={() => setSelectedId(ticket.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/50 rounded-none justify-start h-auto min-h-0",
                      selectedId === ticket.id
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "border-l-2 border-transparent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-semibold text-sm truncate",
                              !ticket.isReadByUser &&
                                "text-foreground font-bold",
                            )}
                          >
                            {ticket.title}
                          </span>
                          {!ticket.isReadByUser && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 inline-block" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-semibold border",
                              getStatusColor(ticket.status),
                            )}
                          >
                            {ticket.status}
                          </span>
                          {ticket.lastMessageAt && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                ticket.lastMessageAt,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ticket.id);
                        }}
                        className="shrink-0 opacity-0 h-7 w-7 hover:text-red-500"
                        title="Delete (visible to you only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 px-6">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">
                Select a conversation or create a new one
              </p>
            </div>
          ) : loadingDetail || !ticketDetail ? (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <Skeleton className="h-12 w-1/3 rounded-lg" />
              <Skeleton className="h-20 w-3/4 rounded-2xl" />
              <Skeleton className="h-20 w-2/3 rounded-2xl ml-auto" />
            </div>
          ) : (
            <>
              <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-background/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedId(null)}
                    className="md:hidden h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {ticketDetail.ticket.title}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-semibold border inline-block mt-0.5",
                        getStatusColor(ticketDetail.ticket.status),
                      )}
                    >
                      {ticketDetail.ticket.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/5">
                {ticketDetail.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <AlertCircle className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                )}
                {ticketDetail.messages.map((msg) => {
                  const isSupport = msg.sender === "support";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        isSupport ? "justify-start" : "flex-row-reverse",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isSupport ? "bg-primary/10" : "bg-muted",
                        )}
                      >
                        {isSupport ? (
                          <Headphones className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed shadow-sm",
                          isSupport
                            ? "bg-card border rounded-tl-sm"
                            : "bg-primary text-primary-foreground rounded-tr-sm",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <span
                          className={cn(
                            "block text-[10px] mt-1.5",
                            isSupport
                              ? "text-muted-foreground"
                              : "text-primary-foreground/70",
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {sendMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-card border shadow-sm p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Sending...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t bg-background shrink-0">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="rounded-full h-10 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-background transition-colors text-sm"
                    disabled={sendMutation.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || sendMutation.isPending}
                    className="w-10 h-10 rounded-full shrink-0"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
