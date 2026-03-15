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
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

function formatBytes(bytes: string | number): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  pdf: FileText,
  document: FileText,
  other: File,
};

const FILE_COLORS: Record<string, string> = {
  image: "text-muted-foreground",
  video: "text-muted-foreground",
  pdf: "text-muted-foreground",
  document: "text-muted-foreground",
  other: "text-muted-foreground",
};

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: "Media Library" },
  ]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Get public URLs for images
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
        toast({ title: "สร้างโฟลเดอร์แล้ว" });
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
      toast({ title: "ลบโฟลเดอร์แล้ว" });
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
    toast({ title: `อัปโหลดแล้ว ${successCount}/${selectedFiles.length} ไฟล์` });
  }

  async function handleDeleteFile(file: MediaFile) {
    if (!confirm(`ลบ "${file.originalName}"?`)) return;
    setDeletingId(`file-${file.id}`);
    try {
      const res = await fetch(`/api/media/files/${file.id}`, { method: "DELETE" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        toast({ title: "ลบไฟล์แล้ว" });
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
      toast({ title: "คัดลอก URL แล้ว" });
    }
  }

  // Drag & drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    // Simulate file input change
    const dt = new DataTransfer();
    droppedFiles.forEach((f) => dt.items.add(f));
    const fakeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleUpload(fakeEvent);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">คลังสื่อ</h1>
            <p className="text-sm text-muted-foreground">จัดการรูปภาพและไฟล์</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setNewFolderDialog(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              โฟลเดอร์ใหม่
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-foreground text-background hover:bg-foreground/90">
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
        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    i === breadcrumb.length - 1 && "text-foreground font-medium"
                  )}
                >
                {i === 0 ? <Home className="h-3.5 w-3.5" /> : crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search + view toggle */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-lg"
              placeholder="ค้นหาไฟล์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto p-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  โฟลเดอร์
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative rounded-lg border bg-card p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                      onDoubleClick={() => navigateToFolder(folder)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FolderOpen className="h-10 w-10 text-muted-foreground" />
                        <p className="text-xs font-medium text-center truncate w-full">{folder.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {folder._count.files} ไฟล์ · {folder._count.children} โฟลเดอร์
                        </p>
                      </div>
                      <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                          disabled={deletingId === `folder-${folder.id}`}
                        >
                          {deletingId === `folder-${folder.id}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 ? (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ไฟล์ ({files.length})
                </h2>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {files.map((file) => {
                      const Icon = FILE_ICONS[file.fileType] ?? File;
                      const iconColor = FILE_COLORS[file.fileType] ?? "text-gray-500";
                      return (
                        <div
                          key={file.id}
                          className="group relative rounded-lg border bg-card overflow-hidden hover:bg-muted/30 transition-colors"
                        >
                          {/* Thumbnail */}
                          <div className="aspect-square bg-muted/30 flex items-center justify-center">
                            {file.fileType === "image" && file.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Icon className={cn("h-10 w-10", iconColor)} />
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{file.originalName}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(file.fileSize)}</p>
                          </div>

                          {/* Hover actions */}
                          <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5 bg-background/90 backdrop-blur-sm rounded p-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyUrl(file)}
                            >
                              {copiedId === file.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteFile(file)}
                              disabled={deletingId === `file-${file.id}`}
                            >
                              {deletingId === `file-${file.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map((file) => {
                      const Icon = FILE_ICONS[file.fileType] ?? File;
                      const iconColor = FILE_COLORS[file.fileType] ?? "text-gray-500";
                      return (
                        <div
                          key={file.id}
                          className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 hover:bg-muted/30 transition-colors"
                        >
                          <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(file.fileSize)} · {file.fileType}
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyUrl(file)}>
                              {copiedId === file.id ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteFile(file)}
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
            ) : folders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-20 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  รองรับ: รูปภาพ, วิดีโอ, PDF, เอกสาร
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

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
    </div>
  );
}
