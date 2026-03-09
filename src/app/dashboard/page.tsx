"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { UtilizationChart } from "@/components/dashboard/UtilizationChart";
import { useStaffing } from "@/lib/hooks/useStaffing";

export default function DashboardPage() {
  const { assignments, members, companies, programs, funds, isLoading } =
    useStaffing();

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            title="Dashboard"
            description="Value Creation Team overview"
          />
          <main className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-6">
                <StatsCards
                  assignments={assignments}
                  companies={companies}
                  members={members}
                  programs={programs}
                />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <UtilizationChart
                    assignments={assignments}
                    members={members}
                  />
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="text-sm font-semibold mb-4">
                      Portfolio Coverage
                    </h3>
                    <div className="space-y-2">
                      {funds.map((fund) => {
                        const fundCompanies = companies.filter(
                          (c) => c.fund_id === fund.id && c.status === "active"
                        );
                        const covered = fundCompanies.filter((c) =>
                          assignments.some(
                            (a) =>
                              a.company_id === c.id && a.workload !== "none"
                          )
                        );
                        return (
                          <div key={fund.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{fund.name}</span>
                              <span className="text-muted-foreground">
                                {covered.length}/{fundCompanies.length}{" "}
                                companies covered
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${
                                    fundCompanies.length > 0
                                      ? (covered.length /
                                          fundCompanies.length) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
