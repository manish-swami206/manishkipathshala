"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Search,
  Trash2,
  Eye,
  Edit,
  Newspaper,
  Calendar,
  Megaphone,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useToast } from "@/hooks/use-toast";
import { adminApi, type AdminCurrentAffairsResponse } from "@/lib/api/endpoints";
import type { CurrentAffairItem } from "@/lib/types/api";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
type CurrentAffairsResponse = AdminCurrentAffairsResponse;

const CATEGORIES = [
  "All",
  "General",
  "National",
  "International",
  "Economy",
  "Science & Tech",
  "State"
];

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
    transition: { delay: i * 0.05, duration: 0.28, ease: "easeOut" },
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

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.28, ease: "easeOut" },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function CurrentAffairsAdminPage() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const qc = useQueryClient();

  // State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CurrentAffairItem | null>(null);

  // Dialog (detail view)
  const [viewingItem, setViewingItem] = useState<CurrentAffairItem | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("General");

  // Sync form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormTitle(editingItem.title);
        setFormSummary(editingItem.summary);
        setFormContent(editingItem.content);
        setFormCategory(editingItem.category);
      } else {
        setFormTitle("");
        setFormSummary("");
        setFormContent("");
        setFormCategory("General");
      }
    }
  }, [sheetOpen, editingItem]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<CurrentAffairsResponse>({
    queryKey: ["admin", "current-affairs", page, debouncedSearch, category],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.listCurrentAffairs(token, {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        category: category === "All" ? undefined : category,
      });
    },
    staleTime: 30000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; summary: string; content: string; category: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.createCurrentAffair(token, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "current-affairs"] });
      toast({ title: "Created!", description: "Current affair published." });
      setSheetOpen(false);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.updateCurrentAffair(token, id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "current-affairs"] });
      toast({ title: "Saved!", description: "Changes applied." });
      setSheetOpen(false);
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.deleteCurrentAffair(token, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "current-affairs"] });
      setDeleteId(null);
      toast({ title: "Deleted", description: "Article removed." });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (item: CurrentAffairItem) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const openView = (item: CurrentAffairItem) => {
    setViewingItem(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim() || !formContent.trim()) {
      toast({ title: "Validation", description: "All fields are required.", variant: "destructive" });
      return;
    }
    const payload = {
      title: formTitle.trim(),
      summary: formSummary.trim(),
      content: formContent.trim(),
      category: formCategory,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const totalPages = data ? Math.ceil(data.total / (data.limit ?? 10)) : 1;
  const items = data?.items ?? [];

  // Reset to page 1 if current page exceeds total pages (e.g. after deleting items on the last page)
  useEffect(() => {
    if (data && data.total > 0 && page > totalPages) {
      setPage(1);
    }
  }, [data, page, totalPages]);

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
              <Newspaper className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Current Affairs
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data?.total ?? 0} total articles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden sm:flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="w-2 h-2 rounded-full bg-violet-500 inline-block"
                  />
                  <span className="text-xs font-semibold text-indigo-700">
                    {items.length} shown
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
                <Plus className="w-4 h-4" /> New Article
              </Button>
            </motion.div>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                if (searchTimer.current) clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => {
                  setDebouncedSearch(val);
                  setPage(1);
                }, 400);
              }}
              placeholder="Search articles..."
              className="pl-9 rounded-xl h-10"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <p className="text-sm text-muted-foreground">Loading articles…</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">
              Failed to load current affairs
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <Megaphone className="w-7 h-7 text-indigo-400" />
                  </div>
                  <EmptyTitle>No articles yet</EmptyTitle>
                  <EmptyDescription>
                    Click &quot;New Article&quot; above to create your first current affair.
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
                      Title
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Category
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Published
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <motion.tr
                        key={item.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors"
                      >
                        <TableCell className="pl-5 py-3.5 max-w-[300px]">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              <Newspaper className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
                                {item.title}
                              </p>
                              {item.summary && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {item.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs bg-violet-50/50 text-indigo-700 border-violet-200"
                          >
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.publishedAt ?? '').toLocaleDateString()}
                          </span>
                        </TableCell>
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
                                    onClick={() => openView(item)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
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
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600"
                                    onClick={() => openEdit(item)}
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
                                    onClick={() => setDeleteId(item.id)}
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
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {data && data.total > 0 && totalPages > 1 && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between"
          >
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg h-9"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg h-9"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Create/Edit Sheet ───────────────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center"
                >
                  <Newspaper className="w-5 h-5 text-indigo-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">
                    {editingItem ? "Edit Article" : "New Article"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {editingItem
                      ? "Update the article details below."
                      : "Create a new current affairs article."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5"
            >
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. India launches new space mission"
                  required
                  className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
                />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Summary *</Label>
                <Textarea
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="A brief summary of the article..."
                  rows={3}
                  required
                  className="rounded-xl border-border/70 resize-none focus-visible:ring-indigo-500/30"
                />
              </motion.div>

              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Content *</Label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Full article content..."
                  rows={8}
                  required
                  className="rounded-xl border-border/70 resize-none focus-visible:ring-indigo-500/30 min-h-[200px]"
                />
              </motion.div>

              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="w-full rounded-xl h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </form>

            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
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
                  disabled={isPending || !formTitle.trim() || !formSummary.trim() || !formContent.trim()}
                  onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Publish"
                  )}
                </Button>
              </motion.div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Detail Dialog ───────────────────────────────────────────────── */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
            {viewingItem && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      {viewingItem.title}
                    </DialogTitle>
                    <Badge
                      variant="outline"
                      className="capitalize shrink-0 bg-violet-50 text-indigo-700 border-violet-200"
                    >
                      {viewingItem.category}
                    </Badge>
                  </div>
                  <DialogDescription className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Published on{" "}
                    {new Date(viewingItem.publishedAt ?? '').toLocaleDateString("en-US", {
                      dateStyle: "full",
                    })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-violet-900 leading-relaxed">
                      {viewingItem.summary}
                    </p>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {viewingItem.content}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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
