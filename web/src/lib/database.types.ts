// Hand-maintained to mirror supabase/migrations. Replace with the output of
// `supabase gen types typescript` once the CLI is linked to the project.
// NOTE: rows are `type` aliases (not interfaces) so they satisfy supabase-js's
// `Record<string, unknown>` constraint.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectRole = 'Admin' | 'PM' | 'Contributor' | 'Viewer';
export type WBSStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type SignatureStatus = 'unsigned' | 'pending' | 'signed' | 'rejected';
export type MilestoneStatus = 'upcoming' | 'reached' | 'missed';
export type AIJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Profile = {
  id: string;
  org_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}

export type Project = {
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
  // added in 003_presales_features.sql
  is_template: boolean | null;
  is_shared: boolean | null;
  share_token: string | null;
}

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  joined_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'job_title'>;
}

export type WBSElement = {
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

export type WBSDependency = {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dep_type: DependencyType;
  lag_days: number;
}

export type ScopeDocument = {
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

export type Discussion = {
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

export type Resource = {
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

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  due_date: string;
  status: MilestoneStatus;
  created_by: string | null;
  created_at: string;
}

export type Webhook = {
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

export type AIJob = {
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

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  diff_json: Json | null;
  ip_address: string | null;
  created_at: string;
}

// Shape returned by the get_shared_project() RPC (public client share link)
export type SharedWBSElement = Pick<
  WBSElement,
  'id' | 'parent_id' | 'wbs_code' | 'level' | 'name' | 'description' | 'status' | 'phase' | 'effort_hours' | 'start_date' | 'end_date' | 'sort_order'
>;
export type SharedProject = Pick<Project, 'id' | 'name' | 'description' | 'start_date' | 'end_date' | 'status'> & {
  wbs: SharedWBSElement[];
};

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

// Supabase client typing — must match supabase-js GenericSchema shape
export type Database = {
  public: {
    Tables: {
      organizations:    TableDef<Organization>;
      profiles:         TableDef<Profile>;
      projects:         TableDef<Project>;
      project_members:  TableDef<ProjectMember>;
      wbs_elements:     TableDef<WBSElement>;
      wbs_dependencies: TableDef<WBSDependency>;
      scope_documents:  TableDef<ScopeDocument>;
      discussions:      TableDef<Discussion>;
      resources:        TableDef<Resource>;
      milestones:       TableDef<Milestone>;
      webhooks:         TableDef<Webhook>;
      ai_jobs:          TableDef<AIJob>;
      audit_log:        TableDef<AuditEntry>;
    };
    Views: { [_ in never]: never };
    Functions: {
      clone_project: {
        Args: { source_id: string; new_name: string; p_is_template: boolean };
        Returns: string;
      };
      get_shared_project: {
        Args: { p_token: string };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
