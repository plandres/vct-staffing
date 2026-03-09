// Manual types matching the Supabase schema
// Run `npm run db:gen-types` to regenerate from live DB

export type UserRole = "owner" | "admin" | "core_vct" | "sop" | "requester" | "viewer";
export type WorkloadLevel = "heavy" | "light" | "none";
export type AssignmentStatus = "to_start" | "ongoing" | "completed" | "roadblock";
export type CompanyStatus = "active" | "inactive" | "exited";
export type ProgramType = "fundamental" | "program";
export type RequestPriority = "urgent" | "high" | "normal" | "low";
export type RequestStatus = "submitted" | "reviewed" | "assigned" | "in_progress" | "completed" | "rejected";
export type ImportStatus = "processing" | "completed" | "failed";
export type ImportFileType = "pptx" | "pdf";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  initials: string | null;
  role: UserRole;
  specialties: string[];
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fund {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  fund_id: string | null;
  sector: string | null;
  geography: string | null;
  status: CompanyStatus;
  deal_partner: string | null;
  deal_team: string[];
  strategic_priorities: StrategicPriority[];
  kpis: Kpi[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StrategicPriority {
  priority: string;
  description: string;
  status: "active" | "completed" | "on_hold";
}

export interface Kpi {
  name: string;
  target: string;
  current: string;
  unit: string;
}

export interface ProgramCategory {
  id: string;
  name: string;
  type: ProgramType;
  display_order: number;
  color: string | null;
  created_at: string;
}

export interface StaffingAssignment {
  id: string;
  member_id: string;
  company_id: string;
  program_id: string;
  workload: WorkloadLevel;
  status: AssignmentStatus;
  start_date: string | null;
  end_date: string | null;
  objectives: string | null;
  external_resources: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportRequest {
  id: string;
  requester_id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  priority: RequestPriority;
  status: RequestStatus;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SopAssignment {
  id: string;
  sop_id: string;
  company_id: string;
  created_at: string;
}

export interface RdqmImport {
  id: string;
  file_name: string;
  file_path: string | null;
  file_type: ImportFileType;
  imported_by: string | null;
  status: ImportStatus;
  changes_summary: Record<string, number> | null;
  error_log: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

// Joined types for UI
export interface StaffingAssignmentWithDetails extends StaffingAssignment {
  member: Profile;
  company: PortfolioCompany;
  program: ProgramCategory;
}

export interface PortfolioCompanyWithFund extends PortfolioCompany {
  fund: Fund | null;
}

export interface SupportRequestWithDetails extends SupportRequest {
  requester: Profile;
  company: PortfolioCompany | null;
  assignee: Profile | null;
}

// Supabase Database type (for generic client)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string; full_name: string }; Update: Partial<Profile> };
      funds: { Row: Fund; Insert: Partial<Fund> & { name: string }; Update: Partial<Fund> };
      portfolio_companies: { Row: PortfolioCompany; Insert: Partial<PortfolioCompany> & { name: string }; Update: Partial<PortfolioCompany> };
      program_categories: { Row: ProgramCategory; Insert: Partial<ProgramCategory> & { name: string }; Update: Partial<ProgramCategory> };
      staffing_assignments: { Row: StaffingAssignment; Insert: Partial<StaffingAssignment> & { member_id: string; company_id: string; program_id: string }; Update: Partial<StaffingAssignment> };
      support_requests: { Row: SupportRequest; Insert: Partial<SupportRequest> & { requester_id: string; title: string }; Update: Partial<SupportRequest> };
      sop_assignments: { Row: SopAssignment; Insert: Partial<SopAssignment> & { sop_id: string; company_id: string }; Update: Partial<SopAssignment> };
      rdqm_imports: { Row: RdqmImport; Insert: Partial<RdqmImport> & { file_name: string; file_type: ImportFileType }; Update: Partial<RdqmImport> };
      activity_log: { Row: ActivityLog; Insert: Partial<ActivityLog> & { action: string }; Update: Partial<ActivityLog> };
    };
  };
}
