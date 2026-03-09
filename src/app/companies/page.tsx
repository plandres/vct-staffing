"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { CompanyList } from "@/components/companies/CompanyList";
import { useCompanies } from "@/lib/hooks/useCompanies";

export default function CompaniesPage() {
  const { companiesByFund, isLoading } = useCompanies();

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title="Portfolio" description="Portfolio companies" />
          <main className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <CompanyList companiesByFund={companiesByFund} />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
