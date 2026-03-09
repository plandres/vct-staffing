"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { createClient } from "@/lib/supabase/client";
import type {
  PortfolioCompany,
  Fund,
  StaffingAssignment,
  Profile,
  ProgramCategory,
} from "@/types/database";

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<PortfolioCompany | null>(null);
  const [fund, setFund] = useState<Fund | null>(null);
  const [assignments, setAssignments] = useState<StaffingAssignment[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [programs, setPrograms] = useState<ProgramCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      const [companyRes, assignmentsRes, membersRes, programsRes] =
        await Promise.all([
          supabase
            .from("portfolio_companies")
            .select("*")
            .eq("id", companyId)
            .single(),
          supabase
            .from("staffing_assignments")
            .select("*")
            .eq("company_id", companyId),
          supabase.from("profiles").select("*").eq("is_active", true),
          supabase
            .from("program_categories")
            .select("*")
            .order("display_order"),
        ]);

      const companyData = companyRes.data as PortfolioCompany | null;
      setCompany(companyData);

      if (companyData?.fund_id) {
        const { data: fundData } = await supabase
          .from("funds")
          .select("*")
          .eq("id", companyData.fund_id)
          .single();
        setFund(fundData as Fund | null);
      }

      setAssignments((assignmentsRes.data as StaffingAssignment[]) ?? []);
      setMembers((membersRes.data as Profile[]) ?? []);
      setPrograms((programsRes.data as ProgramCategory[]) ?? []);
      setIsLoading(false);
    };
    fetchData();
  }, [companyId]);

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            title={company?.name ?? "Loading..."}
            description={
              fund ? `${fund.name} — ${company?.sector ?? ""}` : undefined
            }
          />
          <main className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : company ? (
              <CompanyCard
                company={company}
                fund={fund}
                assignments={assignments}
                members={members}
                programs={programs}
              />
            ) : (
              <p className="text-muted-foreground">Company not found</p>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
