"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  StaffingAssignment,
  Profile,
  PortfolioCompany,
  ProgramCategory,
  Fund,
} from "@/types/database";

export interface StaffingData {
  assignments: StaffingAssignment[];
  members: Profile[];
  companies: PortfolioCompany[];
  programs: ProgramCategory[];
  funds: Fund[];
  isLoading: boolean;
}

export function useStaffing(fundFilter?: string) {
  const [data, setData] = useState<StaffingData>({
    assignments: [],
    members: [],
    companies: [],
    programs: [],
    funds: [],
    isLoading: true,
  });

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchData = useCallback(async () => {
    const [assignmentsRes, membersRes, companiesRes, programsRes, fundsRes] =
      await Promise.all([
        supabase
          .from("staffing_assignments")
          .select("id, member_id, company_id, program_id, workload, status, objectives, external_resources"),
        supabase
          .from("profiles")
          .select("id, full_name, initials, email, role, is_active, specialties, phone")
          .eq("is_active", true)
          .in("role", ["owner", "admin", "core_vct", "sop"]),
        fundFilter
          ? supabase
              .from("portfolio_companies")
              .select("id, name, fund_id, sector, status, strategic_priorities, kpis")
              .eq("fund_id", fundFilter)
              .order("name")
          : supabase
              .from("portfolio_companies")
              .select("id, name, fund_id, sector, status, strategic_priorities, kpis")
              .order("name"),
        supabase
          .from("program_categories")
          .select("id, name, type, display_order")
          .order("display_order"),
        supabase
          .from("funds")
          .select("id, name, display_order")
          .order("display_order"),
      ]);

    setData({
      assignments: (assignmentsRes.data as StaffingAssignment[]) ?? [],
      members: (membersRes.data as Profile[]) ?? [],
      companies: (companiesRes.data as PortfolioCompany[]) ?? [],
      programs: (programsRes.data as ProgramCategory[]) ?? [],
      funds: (fundsRes.data as Fund[]) ?? [],
      isLoading: false,
    });
  }, [supabase, fundFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stable ref so the Realtime callback always calls the latest fetchData
  // without the subscription needing to be re-created on every filter change.
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  // Realtime subscription for staffing changes — created once, never re-subscribed
  useEffect(() => {
    const channel = supabase
      .channel("staffing-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staffing_assignments" },
        () => {
          fetchDataRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const upsertAssignment = async (
    assignment: Partial<StaffingAssignment> & {
      member_id: string;
      company_id: string;
      program_id: string;
    }
  ) => {
    const { error } = await supabase
      .from("staffing_assignments")
      .upsert(assignment, {
        onConflict: "member_id,company_id,program_id",
      });
    if (error) throw error;
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase
      .from("staffing_assignments")
      .delete()
      .eq("id", id);
    if (error) throw error;
  };

  return { ...data, upsertAssignment, deleteAssignment, refetch: fetchData };
}
