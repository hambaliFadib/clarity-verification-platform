"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { TestCase } from "@/lib/types";

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

interface UseInfiniteTestCasesOptions {
  search?: string;
  status?: string;
  module?: string;
  type?: string;
  severity?: string;
  tags?: string;
}

interface UseInfiniteTestCasesReturn {
  items: TestCase[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteTestCases(
  options: UseInfiniteTestCasesOptions = {}
): UseInfiniteTestCasesReturn {
  const { search = "", status = "all", module, type, severity, tags } = options;

  const [items, setItems] = useState<TestCase[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Guard against concurrent fetches
  const fetchingRef = useRef(false);
  // Track the latest fetch request to discard stale results
  const fetchIdRef = useRef(0);
  // IntersectionObserver ref
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Build query string from current filters
  const buildQueryString = useCallback(
    (skip: number) => {
      const params = new URLSearchParams();
      params.set("skip", String(skip));
      params.set("limit", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status && status.toLowerCase() !== "all") {
        // Convert "in-review" to "In Review"
        const statusValue = status.replace(/-/g, " ");
        params.set("status", statusValue);
      }
      if (module) params.set("module", module);
      if (type) params.set("type", type);
      if (severity) params.set("severity", severity);
      if (tags) params.set("tags", tags);
      return params.toString();
    },
    [debouncedSearch, status, module, type, severity, tags]
  );

  // Fetch a page of data
  const fetchPage = useCallback(
    async (skip: number, append: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      const currentFetchId = ++fetchIdRef.current;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const qs = buildQueryString(skip);
        const res = await fetch(`/api/test-cases?${qs}`);
        if (!res.ok) throw new Error("Failed to fetch");

        // Discard if a newer fetch was triggered
        if (currentFetchId !== fetchIdRef.current) return;

        const data = await res.json();
        const newItems: TestCase[] = data.items || [];
        const newTotal: number = data.total ?? 0;

        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setTotal(newTotal);
        setOffset(skip + newItems.length);
      } catch (err) {
        console.error("Failed to load test cases:", err);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
        fetchingRef.current = false;
      }
    },
    [buildQueryString]
  );

  // Reset and fetch from the beginning when filters change
  useEffect(() => {
    setItems([]);
    setOffset(0);
    setTotal(0);
    fetchingRef.current = false;
    fetchPage(0, false);
  }, [debouncedSearch, status, module, type, severity, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMore = items.length < total;

  const loadMore = useCallback(() => {
    if (!hasMore || fetchingRef.current) return;
    fetchPage(offset, true);
  }, [hasMore, offset, fetchPage]);

  const refresh = useCallback(() => {
    setItems([]);
    setOffset(0);
    setTotal(0);
    fetchingRef.current = false;
    fetchPage(0, false);
  }, [fetchPage]);

  // IntersectionObserver sentinel ref callback
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore && !fetchingRef.current) {
            loadMore();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadMore]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    items,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    sentinelRef,
  };
}
