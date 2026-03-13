"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioCompany, Fund } from "@/types/database";

export function useCompanies() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchCompanies = useCallback(async () => {
    const [companiesRes, fundsRes] = await Promise.all([
      supabase.from("portfolio_companies").select("*").order("name"),
      supabase.from("funds").select("*").order("display_order"),
    ]);

    setCompanies((companiesRes.data as PortfolioCompany[]) ?? []);
    setFunds((fundsRes.data as Fund[]) ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const updateCompany = async (
    id: string,
    updates: Partial<PortfolioCompany>
  ) => {
    const { error } = await supabase
      .from("portfolio_companies")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    await fetchCompanies();
  };

  const companiesByFund = useMemo(
    () =>
      funds.map((fund) => ({
        fund,
        companies: companies.filter((c) => c.fund_id === fund.id),
      })),
    [funds, companies]
  );

  return {
    companies,
    funds,
    companiesByFund,
    isLoading,
    updateCompany,
    refetch: fetchCompanies,
  };
}
