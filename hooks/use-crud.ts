"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

interface CrudItem {
  id: string;
}

interface UseCrudOptions {
  toastOnSuccess?: boolean;
}

interface UseCrudResult<T extends CrudItem> {
  items: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useCrud<T extends CrudItem>(
  baseUrl: string,
  options: UseCrudOptions = {}
): UseCrudResult<T> {
  const { toastOnSuccess = true } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(baseUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (mountedRef.current) setItems(Array.isArray(json) ? json : json.data ?? []);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? "สร้างไม่สำเร็จ");
        return null;
      }
      const created = (await res.json()) as T;
      setItems((prev) => [created, ...prev]);
      if (toastOnSuccess) toast.success("สร้างสำเร็จ");
      return created;
    } catch {
      toast.error("เกิดข้อผิดพลาด");
      return null;
    }
  }, [baseUrl, toastOnSuccess]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    try {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? "บันทึกไม่สำเร็จ");
        return null;
      }
      const updated = (await res.json()) as T;
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      if (toastOnSuccess) toast.success("บันทึกสำเร็จ");
      return updated;
    } catch {
      toast.error("เกิดข้อผิดพลาด");
      return null;
    }
  }, [baseUrl, toastOnSuccess]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? "ลบไม่สำเร็จ");
        return false;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (toastOnSuccess) toast.success("ลบสำเร็จ");
      return true;
    } catch {
      toast.error("เกิดข้อผิดพลาด");
      return false;
    }
  }, [baseUrl, toastOnSuccess]);

  return { items, loading, error, refetch, create, update, remove, setItems };
}
