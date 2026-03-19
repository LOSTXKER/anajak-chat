"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Search,
  Image as ImageIcon,
  FileText,
  Video,
  File,
  Trash2,
  ChevronRight,
  Home,
  Loader2,
  X,
  Copy,
  Check,
  LayoutGrid,
  List,
  Download,
  Eye,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatFileSize } from "@/lib/format";

interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  _count: { files: number; children: number };
}

interface MediaFile {
  id: string;
  originalName: string;
  storageKey: string;
  fileType: "image" | "video" | "pdf" | "document" | "other";
  mimeType: string;
  fileSize: string;
  width: number | null;
  height: number | null;
  description: string | null;
  tags: string[];
  createdAt: string;
  url?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  pdf: FileText,
  document: FileText,
  other: File,
};

const FILE_STYLES: Record<string, { icon: string; bg: string; badge: string }> = {
  image: { icon: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  video: { icon: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  pdf: { icon: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  document: { icon: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  other: { icon: "text-muted-foreground", bg: "bg-muted/30", badge: "bg-muted text-muted-foreground" },
};

function getFileStyle(type: string) {
  return FILE_STYLES[type] ?? FILE_STYLES.other;
}

export default function MediaLibraryPage() {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: "คลังสื่อ" },
  ]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`/api/media/folders?parentId=${currentFolderId ?? ""}`),
        fetch(`/api/media/files?folderId=${currentFolderId ?? ""}&search=${encodeURIComponent(search)}`),
      ]);
      if (foldersRes.ok) setFolders(await foldersRes.json());
      if (filesRes.ok) {
        const data = await filesRes.json();
        const filesWithUrls = await Promise.all(
          data.files.map(async (f: MediaFile) => {
            if (f.fileType === "image") {
              const urlRes = await fetch(`/api/media/files/${f.id}`);
              if (urlRes.ok) {
                const d = await urlRes.json();
                return { ...f, url: d.url };
              }
            }
            return f;
          })
        );
        setFiles(filesWithUrls);
      }
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function navigateToFolder(folder: MediaFolder) {
    setCurrentFolderId(folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function navigateToBreadcrumb(index: number) {
    const crumb = breadcrumb[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: currentFolderId }),
      });
      if (res.ok) {
        setNewFolderDialog(false);
        setNewFolderName("");
        fetchData();
        toast.success("สร้างโฟลเดอร์แล้ว");
      }
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleDeleteFolder(folder: MediaFolder) {
    if (!confirm(`ลบโฟลเดอร์ "${folder.name}"? ไฟล์ภายในจะถูกลบด้วย`)) return;
    setDeletingId(`folder-${folder.id}`);
    try {
      await fetch(`/api/media/folders/${folder.id}`, { method: "DELETE" });
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      toast.success("ลบโฟลเดอร์แล้ว");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append("file", file);
      if (currentFolderId) fd.append("folderId", currentFolderId);
      const res = await fetch("/api/media/files/upload", { method: "POST", body: fd });
      if (res.ok) successCount++;
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchData();
    toast.success(`อัปโหลดแล้ว ${successCount}/${selectedFiles.length} ไฟล์`);
  }

  async function handleDeleteFile(file: MediaFile) {
    if (!confirm(`ลบ "${file.originalName}"?`)) return;
    setDeletingId(`file-${file.id}`);
    try {
      const res = await fetch(`/api/media/files/${file.id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        if (previewFile?.id === file.id) setPreviewFile(null);
        toast.success("ลบไฟล์แล้ว");
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function copyUrl(file: MediaFile) {
    let url = file.url;
    if (!url) {
      const res = await fetch(`/api/media/files/${file.id}`);
      if (res.ok) {
        const data = await res.json();
        url = data.url;
      }
    }
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("คัดลอก URL แล้ว");
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    const dt = new DataTransfer();
    droppedFiles.forEach((f) => dt.items.add(f));
    const fakeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleUpload(fakeEvent);
  }

  const VIEW_OPTIONS = [
    { value: "grid" as const, label: "Grid", icon: LayoutGrid },
    { value: "list" as const, label: "List", icon: List },
  ] as const;

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <PageShell className="flex flex-col p-0">
      {/* Header */}
      <div className="shrink-0 px-6 py-6 ring-1 ring-border/40 ring-inset">
        <div className="flex items-center justify-between gap-2 mb-6">
          <PageHeader title="คลังสื่อ" subtitle="จัดการรูปภาพ ไฟล์ และสื่อทั้งหมด" />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setNewFolderDialog(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              โฟลเดอร์ใหม่
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              อัปโหลด
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1 text-sm"
        >
          {breadcrumb.map((crumb, i) => {
            const isCurrent = i === breadcrumb.length - 1;
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/35" aria-hidden />
                )}
                <button
                  type="button"
                  onClick={() => navigateToBreadcrumb(i)}
                  className={cn(
                    "max-w-[min(100%,14rem)] truncate rounded-full px-3 py-1.5 transition-colors",
                    "hover:bg-muted/50 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isCurrent
                      ? "bg-primary/8 font-medium text-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground"
                  )}
                >
                  {i === 0 ? (
                    <span className="inline-flex items-center">
                      <Home className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      <span className="sr-only">{crumb.name}</span>
                    </span>
                  ) : (
                    crumb.name
                  )}
                </button>
              </span>
            );
          })}
        </nav>

        {/* Search + view toggle */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="ค้นหาไฟล์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            size="sm"
            className="w-auto"
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="relative flex-1 overflow-auto p-6 md:p-8"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragging && (
          <div className="absolute inset-0 z-50 m-4 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm ring-2 ring-dashed ring-primary/50">
            <div className="flex flex-col items-center gap-3 text-primary">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Upload className="h-8 w-8" />
              </div>
              <p className="text-lg font-semibold">วางไฟล์เพื่ออัปโหลด</p>
              <p className="text-sm text-muted-foreground">รองรับ: รูปภาพ, วิดีโอ, PDF, เอกสาร</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={Upload}
            message="ยังไม่มีไฟล์ในโฟลเดอร์นี้"
            description="ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด — รองรับ รูปภาพ, วิดีโอ, PDF, เอกสาร"
            action={
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                อัปโหลดไฟล์
              </Button>
            }
            className="rounded-2xl py-20 ring-1 ring-dashed ring-border/40"
          />
        ) : (
          <div className="space-y-10">
            {/* Folders */}
            {folders.length > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  โฟลเดอร์ ({folders.length})
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigateToFolder(folder)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigateToFolder(folder); }}
                      className="group relative flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border/40 transition-all hover:bg-muted/50 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-105">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {folder._count.files} ไฟล์
                          {folder._count.children > 0 && ` · ${folder._count.children} โฟลเดอร์`}
                        </p>
                      </div>
                      <div className="shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                          disabled={deletingId === `folder-${folder.id}`}
                        >
                          {deletingId === `folder-${folder.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ไฟล์ ({files.length})
                </h2>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {files.map((file) => {
                      const Icon = FILE_ICONS[file.fileType] ?? File;
                      const style = getFileStyle(file.fileType);
                      const isPreviewing = previewFile?.id === file.id;
                      return (
                        <div
                          key={file.id}
                          className={cn(
                            "group relative cursor-pointer overflow-hidden rounded-2xl bg-card ring-1 ring-border/40 transition-all hover:bg-muted/50 hover:ring-primary/25",
                            isPreviewing && "bg-primary/8 ring-primary/20"
                          )}
                          onClick={() => setPreviewFile(file)}
                        >
                          {/* Thumbnail */}
                          <div className={cn("aspect-[4/3] flex items-center justify-center", style.bg)}>
                            {file.fileType === "image" && file.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Icon className={cn("h-8 w-8", style.icon)} />
                                <span className={cn("text-[10px] font-semibold uppercase rounded-md px-2 py-0.5", style.badge)}>
                                  {file.fileType}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-3">
                            <p className="text-sm font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.fileSize)}</p>
                          </div>

                          {/* Hover actions */}
                          <div className="absolute right-2 top-2 flex gap-1 rounded-xl bg-background/90 p-1 ring-1 ring-border/40 backdrop-blur-sm transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => { e.stopPropagation(); copyUrl(file); }}
                            >
                              {copiedId === file.id ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                              disabled={deletingId === `file-${file.id}`}
                            >
                              {deletingId === `file-${file.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-border/40 overflow-hidden rounded-2xl bg-card ring-1 ring-border/40">
                    {files.map((file) => {
                      const Icon = FILE_ICONS[file.fileType] ?? File;
                      const style = getFileStyle(file.fileType);
                      const isPreviewing = previewFile?.id === file.id;
                      return (
                        <div
                          key={file.id}
                          className={cn(
                            "group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                            isPreviewing && "bg-primary/8 ring-1 ring-inset ring-primary/20"
                          )}
                          onClick={() => setPreviewFile(file)}
                        >
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", style.bg)}>
                            <Icon className={cn("h-4.5 w-4.5", style.icon)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)} · {file.mimeType.split("/").pop()?.toUpperCase()}
                            </p>
                          </div>
                          {file.tags.length > 0 && (
                            <div className="hidden sm:flex gap-1">
                              {file.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); copyUrl(file); }}>
                              {copiedId === file.id ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* No files in folder that has sub-folders */}
            {files.length === 0 && folders.length > 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">ไม่มีไฟล์ในโฟลเดอร์นี้</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewFile?.originalName}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {/* Preview area */}
              {previewFile.fileType === "image" && previewFile.url ? (
                <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-muted/30 ring-1 ring-border/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewFile.url}
                    alt={previewFile.originalName}
                    className="max-h-[60vh] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center rounded-2xl py-16 ring-1 ring-border/40",
                  getFileStyle(previewFile.fileType).bg
                )}>
                  {(() => {
                    const Icon = FILE_ICONS[previewFile.fileType] ?? File;
                    return <Icon className={cn("h-16 w-16", getFileStyle(previewFile.fileType).icon)} />;
                  })()}
                  <span className={cn(
                    "mt-3 text-xs font-semibold uppercase rounded-md px-3 py-1",
                    getFileStyle(previewFile.fileType).badge
                  )}>
                    {previewFile.mimeType.split("/").pop()?.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">ขนาดไฟล์</p>
                  <p className="font-medium">{formatFileSize(previewFile.fileSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">ประเภท</p>
                  <p className="font-medium">{previewFile.mimeType}</p>
                </div>
                {previewFile.width && previewFile.height && (
                  <div>
                    <p className="text-muted-foreground text-xs">ขนาดภาพ</p>
                    <p className="font-medium">{previewFile.width} x {previewFile.height} px</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">วันที่อัปโหลด</p>
                  <p className="font-medium">{new Date(previewFile.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
              </div>

              {previewFile.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewFile.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => previewFile && copyUrl(previewFile)}>
              <Copy className="mr-2 h-4 w-4" />
              คัดลอก URL
            </Button>
            <Button
              variant="destructive"
              onClick={() => previewFile && handleDeleteFile(previewFile)}
              disabled={!!previewFile && deletingId === `file-${previewFile.id}`}
            >
              {previewFile && deletingId === `file-${previewFile.id}` ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              ลบไฟล์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>สร้างโฟลเดอร์ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>ชื่อโฟลเดอร์</Label>
            <Input
              placeholder="เช่น รูปสินค้า"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
