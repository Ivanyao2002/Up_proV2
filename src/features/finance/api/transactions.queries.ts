"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionsKeys } from "./transactions.keys";
import { transactionsService } from "./transactions.service";

export function useTransactionsList() {
  return useQuery({
    queryKey: transactionsKeys.list(),
    queryFn: () => transactionsService.listAdmin(),
  });
}
