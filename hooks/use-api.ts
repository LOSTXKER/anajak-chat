"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiOptions {
  /** Skip the initial fetch (useful for conditional loading) */
  skip?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching data from an API endpoint.
 * Automatically refetches when the URL changes.
 */
export function useApi<T>(url: string | null, options?: UseApiOptions): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as T;
      setData(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options?.skip) return;
    fetchData();
    return () => { abortRef.current?.abort(); };
  }, [fetchData, options?.skip]);

  return { data, loading, error, refetch: fetchData };
}

// ─── Paginated variant ────────────────────────────────────────────────────────

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

interface UsePaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for paginated API endpoints.
 * Builds the URL with page/limit params and exposes pagination controls.
 */
export function usePaginated<T>(
  baseUrl: string,
  options?: { pageSize?: number; extraParams?: Record<string, string>; skip?: boolean }
): UsePaginatedResult<T> {
  const [page, setPage] = useState(1);
  const pageSize = options?.pageSize ?? 20;

  const url = (() => {
    if (options?.skip) return null;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      ...options?.extraParams,
    });
    // Remove empty params
    for (const [key, val] of params.entries()) {
      if (!val) params.delete(key);
    }
    return `${baseUrl}?${params.toString()}`;
  })();

  const { data, loading, error, refetch } = useApi<PaginatedData<T>>(url, { skip: options?.skip });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    totalPages: data?.totalPages ?? 0,
    loading,
    error,
    setPage,
    refetch,
  };
}
