"use client";

import { useEffect } from "react";
import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  hydrated: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  hydrated: false,
  toggle: () =>
    set((s) => {
      const next = !s.collapsed;
      localStorage.setItem("sidebar-collapsed", String(next));
      return { collapsed: next };
    }),
  setCollapsed: (v) => {
    localStorage.setItem("sidebar-collapsed", String(v));
    set({ collapsed: v });
  },
}));

export function useSidebar() {
  const store = useSidebarStore();

  useEffect(() => {
    if (!store.hydrated) {
      const stored = localStorage.getItem("sidebar-collapsed") === "true";
      useSidebarStore.setState({ collapsed: stored, hydrated: true });
    }
  }, [store.hydrated]);

  return store;
}
