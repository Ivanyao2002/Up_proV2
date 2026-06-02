"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { getQueryClient } from "@/core/api/queryClient";
import { MswProvider } from "./MswProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MswProvider>
        {children}
        <Toaster position="top-center" />
      </MswProvider>
    </QueryClientProvider>
  );
}
