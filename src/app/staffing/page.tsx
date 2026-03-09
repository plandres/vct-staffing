"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { StaffingMatrix } from "@/components/staffing/StaffingMatrix";
import { StaffingFilters } from "@/components/staffing/StaffingFilters";
import { useStaffing } from "@/lib/hooks/useStaffing";

export default function StaffingPage() {
  const [selectedFund, setSelectedFund] = useState<string | undefined>();
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>();
  const [selectedMember, setSelectedMember] = useState<string | undefined>();

  const staffingData = useStaffing();

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            title="Staffing Matrix"
            description="VCT portfolio presence"
          />
          <main className="flex-1 overflow-hidden flex flex-col">
            <StaffingFilters
              funds={staffingData.funds}
              programs={staffingData.programs}
              members={staffingData.members}
              selectedFund={selectedFund}
              selectedProgram={selectedProgram}
              selectedMember={selectedMember}
              onFundChange={setSelectedFund}
              onProgramChange={setSelectedProgram}
              onMemberChange={setSelectedMember}
            />
            <div className="flex-1 overflow-auto">
              <StaffingMatrix
                {...staffingData}
                filterFundId={selectedFund}
                filterProgramId={selectedProgram}
                filterMemberId={selectedMember}
              />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
