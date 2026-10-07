// Shared DB types — mirrored from web/src/lib/database.types.ts
// Update this file after running `supabase gen types typescript`

export type ProjectRole = 'Admin' | 'PM' | 'Contributor' | 'Viewer';
export type WBSStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
export type SignatureStatus = 'unsigned' | 'pending' | 'signed' | 'rejected';
export type MilestoneStatus = 'upcoming' | 'reached' | 'missed';

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

// Stub for Supabase client typing
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations:   { Row: Organization;   Insert: Partial<Organization>;   Update: Partial<Organization>   };
      profiles:        { Row: Profile;        Insert: Partial<Profile>;        Update: Partial<Profile>        };
      projects:        { Row: Project;        Insert: Partial<Project>;        Update: Partial<Project>        };
      project_members: { Row: ProjectMember;  Insert: Partial<ProjectMember>;  Update: Partial<ProjectMember>  };
      wbs_elements:    { Row: WBSElement;     Insert: Partial<WBSElement>;     Update: Partial<WBSElement>     };
      milestones:      { Row: Milestone;      Insert: Partial<Milestone>;      Update: Partial<Milestone>      };
    };
  };
}
