"use client";

import { createContext, useContext } from "react";
import type { Project } from "@/lib/types";

type Ctx = { projects: Project[]; today: string };
const AppCtx = createContext<Ctx>({ projects: [], today: "" });

export function AppProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
