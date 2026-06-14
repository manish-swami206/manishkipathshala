"use client";

import {
  useAdminListSupportTickets,
  useAdminSupportTicket,
  useCreateSupportTicketReply,
  useUpdateSupportTicketStatus,
} from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  RotateCcw,
  Clock,
  Inbox,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Circle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

const STATUSES = ["all", "open", "pending", "resolved", "closed"] as const;
type FilterStatus = (typeof STATUSES)[number];

const STATUS_CONFIG: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  open: {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    label: "Open",
  },
  pending: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Pending",
  },
  resolved: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Resolved",
  },
  closed: {
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500 border-gray-200",
    label: "Closed",
  },
};

function relativeTime(dateStr: string | Date) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function messageTime(dateStr: string | Date) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupportTicketsAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // FIX: UUIDs are strings, not numbers
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticketsList, isLoading: loadingList } =
    useAdminListSupportTickets({
      status: filterStatus === "all" ? undefined : filterStatus,
      search: debouncedSearch || undefined,
      page: 1,
      limit: 50,
    });

  const { data: ticketThread, isLoading: loadingThread } =
    useAdminSupportTicket(selectedTicketId ?? "", {
      query: { enabled: !!selectedTicketId },
    });

  const replyMutation = useCreateSupportTicketReply(selectedTicketId ?? "");
  const statusMutation = useUpdateSupportTicketStatus(selectedTicketId ?? "");

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketThread?.messages?.length]);

  const invalidateTicket = () => {
    // FIX: invalidate both detail and list so reply shows up immediately
    queryClient.invalidateQueries({
      queryKey: ["admin", "supportTickets", "detail", selectedTicketId],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", "supportTickets", "list"],
    });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    try {
      await replyMutation.mutateAsync({ message: replyText });
      setReplyText("");
      invalidateTicket();
      toast({ title: "Reply sent" });
    } catch {
      toast({ title: "Failed to send reply", variant: "destructive" });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      await statusMutation.mutateAsync(status);
      invalidateTicket();
      toast({
        title: `Ticket marked as ${STATUS_CONFIG[status]?.label ?? status}`,
      });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const tickets = ticketsList?.data ?? [];

  const sharedProps = {
    tickets,
    loadingList,
    selectedTicketId,
    setSelectedTicketId,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    ticketsList,
  };

  const detailProps = {
    ticketThread,
    loadingThread,
    selectedTicketId,
    handleStatusChange,
    replyText,
    setReplyText,
    handleSendReply,
    replyMutation,
    messagesEndRef,
    statusMutation,
  };

  return (
    <div className="w-full px-5 py-4 space-y-3 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-600" />
          Support Tickets
          {ticketsList?.pagination?.total != null && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium ml-1">
              {ticketsList.pagination.total}
            </span>
          )}
        </h1>
        <p className="text-xs text-gray-400">
          Manage and reply to student support requests
        </p>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex-1 min-h-0">
        {selectedTicketId ? (
          <div className="flex flex-col h-full gap-3">
            <button
              onClick={() => setSelectedTicketId(null)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors w-fit"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to tickets
            </button>
            <TicketDetailPanel {...detailProps} />
          </div>
        ) : (
          <TicketListPanel {...sharedProps} />
        )}
      </div>

      {/* Desktop: 1/3 + 2/3 */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_2fr] gap-4 flex-1 min-h-0">
        <TicketListPanel {...sharedProps} />
        <TicketDetailPanel {...detailProps} />
      </div>
    </div>
  );
}

// ── Ticket List Panel ─────────────────────────────────────────────────────────

function TicketListPanel({
  tickets,
  loadingList,
  selectedTicketId,
  setSelectedTicketId,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  ticketsList,
}: {
  tickets: Array<{ id: string; title: string; status: string; isReadByAdmin?: boolean; lastMessageAt?: Date | string | null; createdAt: Date | string; messageCount?: number }>;
  loadingList: boolean;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (s: FilterStatus) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  ticketsList: { pagination?: { total?: number } } | undefined;
}) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-0">
      {/* Search + Filters */}
      <div className="p-3 border-b border-gray-100 space-y-2.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="pl-8 h-8 text-xs rounded-lg border-gray-200 bg-gray-50 focus-visible:bg-white"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-0.5">
          {STATUSES.map((st) => {
            const active = filterStatus === st;
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap transition-all border",
                  active
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700",
                )}
              >
                {st !== "all" && cfg && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      active ? "bg-white/70" : cfg.dot,
                    )}
                  />
                )}
                {st === "all" ? "All" : cfg?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loadingList ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-16 px-6 text-center">
            <Inbox className="w-8 h-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No tickets found
            </p>
            <p className="text-xs text-gray-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tickets.map((ticket) => {
              const cfg = STATUS_CONFIG[ticket.status];
              const isSelected = selectedTicketId === ticket.id;
              const unread = ticket.isReadByAdmin === false;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors relative",
                    isSelected
                      ? "bg-violet-50 border-l-2 border-violet-500 pl-[14px]"
                      : "border-l-2 border-transparent hover:bg-gray-50/80 pl-[14px]",
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Status dot */}
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        cfg?.dot ?? "bg-gray-300",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-sm truncate flex-1",
                            unread
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700",
                          )}
                        >
                          {ticket.title}
                        </p>
                        {unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-px rounded border font-medium",
                            cfg?.badge ??
                              "bg-gray-100 text-gray-500 border-gray-200",
                          )}
                        >
                          {cfg?.label ?? ticket.status}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto">
                          <Clock className="w-2.5 h-2.5" />
                          {relativeTime(
                            ticket.lastMessageAt ?? ticket.createdAt,
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {ticket.messageCount ?? 0} msg
                          {ticket.messageCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ticket Detail Panel ───────────────────────────────────────────────────────

function TicketDetailPanel({
  ticketThread,
  loadingThread,
  selectedTicketId,
  handleStatusChange,
  replyText,
  setReplyText,
  handleSendReply,
  replyMutation,
  messagesEndRef,
  statusMutation,
}: {
  ticketThread?: {
    ticket: { id: string; title: string; status: string; userName?: string; userId: string };
    messages: Array<{ id: string; sender: string; message: string; createdAt: Date | string }>;
  } | undefined;
  loadingThread?: boolean;
  selectedTicketId?: string | null;
  handleStatusChange: (status: string) => Promise<void>;
  replyText: string;
  setReplyText: (s: string) => void;
  handleSendReply: (e: React.FormEvent) => Promise<void>;
  replyMutation: { isPending: boolean };
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  statusMutation: { isPending: boolean };
}) {
  if (!selectedTicketId) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl gap-3 text-center px-6">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-600 text-sm">
            No ticket selected
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Select a ticket from the list to view the conversation.
          </p>
        </div>
      </div>
    );
  }

  if (loadingThread || !ticketThread) {
    return (
      <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-0">
        <div className="p-4 border-b space-y-2">
          <Skeleton className="h-5 w-2/5 rounded-lg" />
          <Skeleton className="h-3.5 w-1/4 rounded" />
        </div>
        <div className="flex-1 p-5 space-y-4">
          <Skeleton className="h-16 w-3/5 rounded-2xl" />
          <Skeleton className="h-14 w-2/5 rounded-2xl ml-auto" />
          <Skeleton className="h-16 w-1/2 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { ticket, messages } = ticketThread;
  const cfg = STATUS_CONFIG[ticket.status];
  const isTerminal = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-0">
      {/* Thread header */}
      <div className="px-5 py-3.5 border-b bg-white shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {ticket.title}
              </h3>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0",
                  cfg?.badge,
                )}
              >
                {cfg?.label ?? ticket.status}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 truncate">
              {ticket.userName ?? ticket.userId}
            </p>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isTerminal ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-lg gap-1.5 border-gray-200 text-gray-600 hover:text-gray-900"
                  onClick={() => handleStatusChange("closed")}
                  disabled={statusMutation.isPending}
                >
                  <XCircle className="w-3.5 h-3.5" /> Close
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs rounded-lg gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => handleStatusChange("resolved")}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Resolve
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg gap-1.5 border-gray-200"
                onClick={() => handleStatusChange("open")}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Reopen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-gray-50/40 min-h-0">
        {(!messages || messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
            <AlertCircle className="w-7 h-7 text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400">
              Reply below to start the conversation.
            </p>
          </div>
        )}

        {messages?.map((msg: { id: string; sender: string; message: string; createdAt: string }, idx: number) => {
          const isSupport = msg.sender === "support";
          // Group consecutive messages from the same sender
          const prevSame = idx > 0 && messages[idx - 1]?.sender === msg.sender;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isSupport ? "justify-end" : "justify-start",
                prevSame ? "mt-1" : "mt-3",
              )}
            >
              <div
                className={cn(
                  "flex flex-col max-w-[72%]",
                  isSupport && "items-end",
                )}
              >
                {!prevSame && (
                  <span className="text-[10px] text-gray-400 mb-1 px-1">
                    {isSupport ? "Support" : "Student"}
                  </span>
                )}
                <div
                  className={cn(
                    "px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                    isSupport
                      ? "bg-violet-600 text-white rounded-2xl rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100",
                  )}
                >
                  {msg.message}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 px-1",
                    isSupport ? "text-gray-400 text-right" : "text-gray-400",
                  )}
                >
                  {messageTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Optimistic pending bubble */}
        {replyMutation.isPending && (
          <div className="flex justify-end mt-1">
            <div className="bg-violet-400 text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm opacity-70 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sending…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="p-3 border-t bg-white shrink-0">
        <form onSubmit={handleSendReply} className="flex gap-2 items-center">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (replyText.trim() && !replyMutation.isPending) {
                  handleSendReply(e as unknown as React.FormEvent);
                }
              }
            }}
            placeholder="Reply to student… (Enter to send)"
            className="flex-1 h-9 rounded-xl bg-gray-50 border-gray-200 text-sm focus-visible:ring-violet-500/30 focus-visible:bg-white"
            disabled={replyMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={replyMutation.isPending || !replyText.trim()}
            className="h-9 w-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 shrink-0 shadow-sm"
          >
            {replyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
