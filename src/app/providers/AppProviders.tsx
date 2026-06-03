"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { getQueryClient } from "@/core/api/queryClient";
import { MswProvider } from "./MswProvider";
import { ThemeProvider } from "@/core/theme/ThemeProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MswProvider>
          {children}
          <Toaster position="top-center" />
        </MswProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
