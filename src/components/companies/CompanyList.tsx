"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import type { PortfolioCompany, Fund } from "@/types/database";

interface CompanyListProps {
  companiesByFund: { fund: Fund; companies: PortfolioCompany[] }[];
}

export function CompanyList({ companiesByFund }: CompanyListProps) {
  return (
    <div className="space-y-6">
      {companiesByFund.map(({ fund, companies }) => (
        <div key={fund.id}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {fund.name} ({companies.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-medium truncate">{company.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {company.sector && (
                      <span className="text-xs text-muted-foreground">
                        {company.sector}
                      </span>
                    )}
                    {company.geography && (
                      <span className="text-xs text-muted-foreground">
                        {company.geography}
                      </span>
                    )}
                  </div>
                  {company.deal_partner && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Deal Partner: {company.deal_partner}
                    </p>
                  )}
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      company.status === "active"
                        ? "bg-green-100 text-green-700"
                        : company.status === "exited"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {company.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
