"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Megaphone,
  ExternalLink,
  Edit,
  Zap,
  Info,
  AlertTriangle,
  CheckCircle2,
  Bell,
  ToggleLeft,
  ToggleRight,
  Loader2,

} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { ALL_NAV_ITEMS } from "@/components/layout/AppLayout";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Announcement {
  id: number;
  title: string;
  body: string | null;
  type: "urgent" | "warning" | "success" | "info";
  isActive: boolean;
  linkText: string | null;
  linkUrl: string | null;
  createdAt: string;
}

const TYPES = ["info", "success", "warning", "urgent"] as const;

// ── Type Config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  info: {
    icon: Info,
    label: "Info",
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  urgent: {
    icon: Zap,
    label: "Urgent",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

// ── Animation variants ────────────────────────────────────────────────────────
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.055, duration: 0.28, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AnnouncementsAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [deleteTargetId, setDeleteId] = useState<number | null>(null);

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminFetch<Announcement[]>("/api/admin/announcements"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      adminFetch<Announcement>(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      adminFetch<Record<string, unknown>>(`/api/admin/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      setDeleteId(null);
      toast({ title: "Deleted", description: "Announcement removed." });
    },
  });

  const openCreate = () => {
    setEditingAnnouncement(null);
    setSheetOpen(true);
  };
  const openEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setSheetOpen(true);
  };

  const activeCount = announcements.filter((a) => a.isActive).length;

  return (
    <TooltipProvider>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6 p-2 sm:p-4"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
              transition={{ duration: 0.45 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0"
            >
              <Megaphone className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Announcements
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage alert banners displayed to all students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Stats pill */}
            <AnimatePresence>
              {announcements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="w-2 h-2 rounded-full bg-emerald-500 inline-block"
                  />
                  <span className="text-xs font-semibold text-emerald-700">
                    {activeCount} active
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
            >
              <Button
                onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-bold gap-1.5 shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> New Announcement
              </Button>
            </motion.div>
          </div>
        </div>

        {/* ── Stats Bar ───────────────────────────────────────────────────── */}
        {announcements.length > 0 && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {TYPES.map((t) => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              const count = announcements.filter((a) => a.type === t).length;
              return (
                <motion.div
                  key={t}
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${cfg.bg}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {cfg.label}
                    </p>
                    <p
                      className={`text-xl font-extrabold leading-none mt-0.5 ${cfg.color}`}
                    >
                      {count}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Table Card ──────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
              >
                <Loader2 className="w-7 h-7 text-indigo-500" />
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Loading announcements…
              </p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <Bell className="w-7 h-7 text-indigo-400" />
                  </div>
                  <EmptyTitle>No announcements yet</EmptyTitle>
                  <EmptyDescription>
                    Click &quot;New Announcement&quot; above to publish your
                    first banner.
                  </EmptyDescription>
                  <Button
                    onClick={openCreate}
                    variant="outline"
                    className="mt-4 rounded-xl gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="w-4 h-4" /> Create one
                  </Button>
                </motion.div>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500 pl-5">
                      Alert Notice
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Priority
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {announcements.map((ann, i) => {
                      const cfg = TYPE_CONFIG[ann.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.tr
                          key={ann.id}
                          custom={i}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors"
                        >
                          {/* Title + body */}
                          <TableCell className="pl-5 py-3.5 max-w-[300px]">
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${cfg.bg}`}
                              >
                                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
                                  {ann.title}
                                </p>
                                {ann.body && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {ann.body}
                                  </p>
                                )}
                                {ann.linkUrl && (
                                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-500">
                                    <ExternalLink className="w-3 h-3" />
                                    {ann.linkText ?? "Link"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Badge */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                              />
                              {cfg.label}
                            </span>
                          </TableCell>

                          {/* Toggle */}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.93 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                  }}
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      id: ann.id,
                                      isActive: !ann.isActive,
                                    })
                                  }
                                  className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                                    ann.isActive
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                      : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                                  }`}
                                >
                                  {ann.isActive ? (
                                    <ToggleRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ToggleLeft className="w-3.5 h-3.5" />
                                  )}
                                  {ann.isActive ? "LIVE" : "PAUSED"}
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Click to {ann.isActive ? "pause" : "activate"}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right pr-5">
                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                                      onClick={() => openEdit(ann)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                                      onClick={() => setDeleteId(ann.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* ── Sheet ───────────────────────────────────────────────────────── */}
        <AnnouncementFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editing={editingAnnouncement}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
            setSheetOpen(false);
          }}
        />

        {/* ── Delete Confirm ──────────────────────────────────────────────── */}
        <ConfirmDeleteDialog
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteTargetId !== null) deleteMutation.mutate(deleteTargetId);
          }}
        />
      </motion.div>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnnouncementFormSheet — create / edit sheet
// ─────────────────────────────────────────────────────────────────────────────
interface SheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Announcement | null;
  onSuccess: () => void;
}

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.28, ease: "easeOut" },
  }),
};

function AnnouncementFormSheet({
  open,
  onOpenChange,
  editing,
  onSuccess,
}: SheetProps) {
  const { toast } = useToast();
  const adminFetch = useAdminFetch();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [type, setType] = useState<Announcement["type"]>(
    editing?.type ?? "info",
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [linkText, setLinkText] = useState(editing?.linkText ?? "");
  const [linkUrl, setLinkUrl] = useState(editing?.linkUrl ?? "");

  // Sync form whenever the sheet opens or the editing target changes.
  // useEffect is the correct tool here — handleOpenChange is NOT called when
  // `open` is set programmatically by the parent, only on internal Sheet events.
  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setBody(editing?.body ?? "");
      setType(editing?.type ?? "info");
      setIsActive(editing?.isActive ?? true);
      setLinkText(editing?.linkText ?? "");
      setLinkUrl(editing?.linkUrl ?? "");
    } else {
      // Reset to blank when sheet closes so create-mode is always clean
      setTitle("");
      setBody("");
      setType("info");
      setIsActive(true);
      setLinkText("");
      setLinkUrl("");
    }
  }, [open, editing]);

  const handleOpenChange = (v: boolean) => onOpenChange(v);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      adminFetch<Announcement>("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast({ title: "Published!", description: "Announcement is now live." });
      onSuccess();
    },
    onError: (err: Error) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      adminFetch<Announcement>(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast({ title: "Saved!", description: "Changes applied." });
      onSuccess();
    },
    onError: (err: Error) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      body: body.trim() || null,
      type,
      isActive,
      linkText: linkText.trim() || null,
      linkUrl: linkUrl.trim() || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const activeCfg = TYPE_CONFIG[type];
  const ActiveIcon = activeCfg.icon;

  const fields = [
    {
      id: "title",
      label: "Title *",
      node: (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Exam rescheduled to Monday"
          required
          className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
        />
      ),
    },
    {
      id: "body",
      label: "Description",
      node: (
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Optional extended message for students..."
          rows={3}
          className="rounded-xl border-border/70 resize-none focus-visible:ring-indigo-500/30"
        />
      ),
    },
    {
      id: "priority",
      label: "Priority Tone",
      node: (
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => {
            const cfg = TYPE_CONFIG[t];
            const TIcon = cfg.icon;
            return (
              <motion.button
                key={t}
                type="button"
                onClick={() => setType(t)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 20 }}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                  type === t
                    ? `${cfg.bg} ${cfg.color} border-current shadow-sm`
                    : "border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                <TIcon className="w-4 h-4" />
                {cfg.label}
              </motion.button>
            );
          })}
        </div>
      ),
    },
    {
      id: "status",
      label: "Status",
      node: (
        <div className="flex items-center gap-3">
          {[true, false].map((val) => (
            <motion.button
              key={String(val)}
              type="button"
              onClick={() => setIsActive(val)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                isActive === val
                  ? val
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                    : "bg-gray-100 border-gray-400 text-gray-600"
                  : "border-border/40 text-muted-foreground hover:border-border"
              }`}
            >
              {val ? "🟢 Active (Live)" : "⏸ Draft"}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      id: "linkText",
      label: "Button Label",
      node: (
        <Input
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder='e.g. "View Details"'
          className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
        />
      ),
    },
    {
      id: "linkUrl",
      label: "Redirect URL",
      node: (
        <div className="space-y-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/syllabus or https://..."
            className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
          />
          <div className="flex flex-wrap gap-1.5">
            {ALL_NAV_ITEMS.filter((item) => !item.protected || item.label === "Home").slice(0, 8).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setLinkUrl(item.href)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full border border-border/60 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <Icon className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
            {linkUrl && (
              <button
                type="button"
                onClick={() => setLinkUrl("")}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Sheet header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <motion.div
              key={type}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeCfg.bg}`}
            >
              <ActiveIcon className={`w-5 h-5 ${activeCfg.color}`} />
            </motion.div>
            <div>
              <SheetTitle className="text-base font-bold text-gray-900">
                {editing ? "Edit Announcement" : "New Announcement"}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {editing
                  ? "Update the alert details below."
                  : "Configure and publish a new alert banner."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">

          {fields.map((f, i) => (
            <motion.div
              key={f.id}
              custom={i}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-1.5"
            >
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {f.label}
              </Label>
              {f.node}
            </motion.div>
          ))}

          {/* Live preview */}
          {/* <AnimatePresence mode="wait">
            {title.trim() && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="space-y-1.5"
              >
                <Separator />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-1">
                  Live Preview
                </p>
                <div
                  className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${activeCfg.bg}`}
                >
                  <ActiveIcon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${activeCfg.color}`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold leading-snug ${activeCfg.color}`}
                    >
                      {title}
                    </p>
                    {body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {body}
                      </p>
                    )}
                    {linkUrl && linkText && (
                      <span
                        className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold ${activeCfg.color}`}
                      >
                        {linkText} <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}
        </form>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl font-semibold"
          >
            Cancel
          </Button>
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
          >
            <Button
              type="submit"
              form=""
              disabled={isPending || !title.trim()}
              onClick={handleSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : editing ? (
                "Save Changes"
              ) : (
                "Publish"
              )}
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
