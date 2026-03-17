"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Image as ImageIcon, File, Loader2, X, Check, FolderOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: string;
  url?: string;
}

interface MediaFolder {
  id: string;
  name: string;
  _count: { files: number; children: number };
}

interface MediaPickerModalProps {
  onSelect: (file: { id: string; url: string; name: string; fileType: string }) => void;
  onClose: () => void;
}

export function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`/api/media/folders?parentId=${currentFolderId ?? ""}`),
        fetch(
          `/api/media/files?folderId=${currentFolderId ?? ""}&fileType=image&search=${encodeURIComponent(search)}&limit=48`
        ),
      ]);
      if (foldersRes.ok) setFolders(await foldersRes.json());
      if (filesRes.ok) {
        const data = await filesRes.json();
        // Fetch public URLs
        const withUrls = await Promise.all(
          data.files.map(async (f: MediaFile) => {
            const res = await fetch(`/api/media/files/${f.id}`);
            if (res.ok) {
              const d = await res.json();
              return { ...f, url: d.url };
            }
            return f;
          })
        );
        setFiles(withUrls);
      }
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function enterFolder(folder: MediaFolder) {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  }

  function goBack() {
    const newStack = folderStack.slice(0, -1);
    setFolderStack(newStack);
    setCurrentFolderId(newStack.length > 0 ? newStack[newStack.length - 1].id : null);
  }

  const selectedFile = files.find((f) => f.id === selectedId);

  function handleConfirm() {
    if (!selectedFile?.url) return;
    onSelect({ id: selectedFile.id, url: selectedFile.url, name: selectedFile.originalName, fileType: selectedFile.fileType });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[min(600px,85vh)] w-full max-w-2xl flex-col rounded-xl border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {folderStack.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <span className="font-medium">
            {folderStack.length > 0 ? folderStack[folderStack.length - 1].name : "Media Library"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-7 w-40 pl-8 text-sm"
                placeholder="ค้นหา..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      className="flex flex-col items-center gap-1.5 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      onDoubleClick={() => enterFolder(folder)}
                      onClick={() => enterFolder(folder)}
                    >
                      <FolderOpen className="h-8 w-8 text-yellow-500" />
                      <p className="text-xs font-medium truncate w-full text-center">{folder.name}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Files grid */}
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">ไม่มีรูปภาพ</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedId(file.id === selectedId ? null : file.id)}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 overflow-hidden transition-all",
                        selectedId === file.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      {file.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <File className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {selectedId === file.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t px-4 py-3">
          {selectedFile && (
            <p className="truncate text-sm text-muted-foreground flex-1">{selectedFile.originalName}</p>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button onClick={handleConfirm} disabled={!selectedId}>
              ส่งรูปภาพ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
