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
        supabase.from("staffing_assignments").select("*"),
        supabase
          .from("profiles")
          .select("*")
          .eq("is_active", true)
          .in("role", ["owner", "admin", "core_vct", "sop"]),
        fundFilter
          ? supabase
              .from("portfolio_companies")
              .select("*")
              .eq("fund_id", fundFilter)
              .order("name")
          : supabase
              .from("portfolio_companies")
              .select("*")
              .order("name"),
        supabase
          .from("program_categories")
          .select("*")
          .order("display_order"),
        supabase.from("funds").select("*").order("display_order"),
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

  // Realtime subscription for staffing changes
  useEffect(() => {
    const channel = supabase
      .channel("staffing-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staffing_assignments" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData]);

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
