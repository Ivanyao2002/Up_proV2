"use client";

import { useQuery } from "@tanstack/react-query";
import {
  partnerRecurringService,
  partnerReportsService,
  partnerShiftsService,
} from "./shifts.service";

export function usePartnerShifts() {
  return useQuery({
    queryKey: ["partner", "shifts"],
    queryFn: () => partnerShiftsService.list(),
  });
}

export function usePartnerRecurringBookings() {
  return useQuery({
    queryKey: ["partner", "bookings", "recurring"],
    queryFn: () => partnerRecurringService.list(),
  });
}

export function usePartnerReports() {
  return useQuery({
    queryKey: ["partner", "reports"],
    queryFn: () => partnerReportsService.list(),
  });
}
