// Auto-generated from Phase 1 schema. Update after running `supabase gen types`.
// Placeholder until Supabase project is provisioned.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectRole = 'Admin' | 'PM' | 'Contributor' | 'Viewer';
export type WBSStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type SignatureStatus = 'unsigned' | 'pending' | 'signed' | 'rejected';
export type MilestoneStatus = 'upcoming' | 'reached' | 'missed';
export type AIJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  budget_hours: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  joined_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'job_title'>;
}

export interface WBSElement {
  id: string;
  project_id: string;
  parent_id: string | null;
  wbs_code: string;
  level: number;
  name: string;
  description: string | null;
  status: WBSStatus;
  phase: string | null;
  effort_hours: number | null;
  effort_days: number | null;
  start_date: string | null;
  end_date: string | null;
  assigned_to: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  assignee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  children?: WBSElement[];
}

export interface WBSDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dep_type: DependencyType;
  lag_days: number;
}

export interface ScopeDocument {
  id: string;
  project_id: string;
  title: string;
  sow_text: string | null;
  version: number;
  signature_status: SignatureStatus;
  signed_by: string | null;
  signed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  wbs_element_id: string;
  parent_comment_id: string | null;
  author_id: string;
  body: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  replies?: Discussion[];
}

export interface Resource {
  id: string;
  project_id: string;
  wbs_element_id: string;
  user_id: string;
  effort_allocated_h: number;
  role_label: string | null;
  assigned_at: string;
  profile?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  wbs_element?: Pick<WBSElement, 'id' | 'name' | 'wbs_code'>;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  due_date: string;
  status: MilestoneStatus;
  created_by: string | null;
  created_at: string;
}

export interface Webhook {
  id: string;
  project_id: string;
  name: string;
  trigger_event: string;
  endpoint_url: string;
  secret_token: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AIJob {
  id: string;
  project_id: string;
  scope_doc_id: string | null;
  status: AIJobStatus;
  input_text: string | null;
  output_json: Json | null;
  reviewed: boolean;
  approved: boolean | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  diff_json: Json | null;
  ip_address: string | null;
  created_at: string;
}

// Stub for Supabase client typing
export interface Database {
  public: {
    Tables: {
      organizations:         { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> };
      profiles:              { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      projects:              { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      project_members:       { Row: ProjectMember; Insert: Partial<ProjectMember>; Update: Partial<ProjectMember> };
      wbs_elements:          { Row: WBSElement; Insert: Partial<WBSElement>; Update: Partial<WBSElement> };
      wbs_dependencies:      { Row: WBSDependency; Insert: Partial<WBSDependency>; Update: Partial<WBSDependency> };
      scope_documents:       { Row: ScopeDocument; Insert: Partial<ScopeDocument>; Update: Partial<ScopeDocument> };
      discussions:           { Row: Discussion; Insert: Partial<Discussion>; Update: Partial<Discussion> };
      resources:             { Row: Resource; Insert: Partial<Resource>; Update: Partial<Resource> };
      milestones:            { Row: Milestone; Insert: Partial<Milestone>; Update: Partial<Milestone> };
      webhooks:              { Row: Webhook; Insert: Partial<Webhook>; Update: Partial<Webhook> };
      ai_jobs:               { Row: AIJob; Insert: Partial<AIJob>; Update: Partial<AIJob> };
      audit_log:             { Row: AuditEntry; Insert: Partial<AuditEntry>; Update: Partial<AuditEntry> };
    };
  };
}
