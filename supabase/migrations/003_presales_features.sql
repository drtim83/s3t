-- ============================================================
-- S3T — Migration 003: Pre-Sales features + RLS hardening
-- Safe to re-run (idempotent). Run in Supabase → SQL Editor.
--
-- Fixes:
--   * Adds is_template / is_shared / share_token (were missing in prod)
--   * clone_project(): now checks the caller may read the source project
--     (it was SECURITY DEFINER with no auth check → any user could clone
--     any project) and adds the caller as Admin of the clone
--   * get_shared_project(): pinned search_path, callable by anon
--   * get_user_id_by_email(): referenced by the Invite Member UI but never
--     defined
--   * Project creators are now auto-added as Admin (previously RLS blocked
--     them from adding WBS items to their own project)
--   * Missing DELETE policy on projects, UPDATE/DELETE on project_members
--   * project_members SELECT policy queried itself (recursion risk) —
--     replaced with SECURITY DEFINER helpers
-- ============================================================

-- ─── 1. Columns ──────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_shared   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_token UUID    NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);
CREATE INDEX IF NOT EXISTS idx_pm_user ON project_members(user_id);

-- ─── 2. RLS helper functions (bypass RLS → no policy recursion) ──
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_role(p_project_id UUID, p_roles project_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid() AND role = ANY (p_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.is_project_member(UUID)                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_project_role(UUID, project_role[])  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID)                TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_project_role(UUID, project_role[]) TO authenticated;

-- ─── 3. Auto-membership for project creators ─────────────────
CREATE OR REPLACE FUNCTION public.set_project_creator()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_project_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'Admin')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_set_creator ON projects;
CREATE TRIGGER trg_projects_set_creator
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_creator();

DROP TRIGGER IF EXISTS trg_projects_creator_admin ON projects;
CREATE TRIGGER trg_projects_creator_admin
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION public.add_project_creator_as_admin();

-- Backfill: existing creators who were never added as members
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.created_by, 'Admin'
FROM projects p
WHERE p.created_by IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ─── 4. Policies ─────────────────────────────────────────────
-- projects
DROP POLICY IF EXISTS "projects_select_members" ON projects;
DROP POLICY IF EXISTS "projects_update_pm"      ON projects;
DROP POLICY IF EXISTS "projects_delete_admin"   ON projects;
CREATE POLICY "projects_select_members" ON projects
  FOR SELECT USING (public.is_project_member(id) OR created_by = auth.uid());
CREATE POLICY "projects_update_pm" ON projects
  FOR UPDATE USING (public.has_project_role(id, ARRAY['Admin','PM']::project_role[]));
CREATE POLICY "projects_delete_admin" ON projects
  FOR DELETE USING (public.has_project_role(id, ARRAY['Admin']::project_role[]));

-- project_members
DROP POLICY IF EXISTS "pm_select_members" ON project_members;
DROP POLICY IF EXISTS "pm_insert_admin"   ON project_members;
DROP POLICY IF EXISTS "pm_update_admin"   ON project_members;
DROP POLICY IF EXISTS "pm_delete_admin"   ON project_members;
CREATE POLICY "pm_select_members" ON project_members
  FOR SELECT USING (public.is_project_member(project_id));
-- Only project Admins may add members. (The old policy also allowed
-- `auth.uid() = user_id`, which let any user add themselves to any project.)
CREATE POLICY "pm_insert_admin" ON project_members
  FOR INSERT WITH CHECK (public.has_project_role(project_id, ARRAY['Admin']::project_role[]));
CREATE POLICY "pm_update_admin" ON project_members
  FOR UPDATE USING (public.has_project_role(project_id, ARRAY['Admin']::project_role[]));
CREATE POLICY "pm_delete_admin" ON project_members
  FOR DELETE USING (public.has_project_role(project_id, ARRAY['Admin']::project_role[]));

-- Profiles of co-members must be readable for the member list / avatars
DROP POLICY IF EXISTS "profiles_select_comembers" ON profiles;
CREATE POLICY "profiles_select_comembers" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT pm.user_id FROM project_members pm
      WHERE public.is_project_member(pm.project_id)
    )
  );

-- ─── 5. clone_project (Scenario Planning & Templates) ────────
CREATE OR REPLACE FUNCTION public.clone_project(source_id UUID, new_name TEXT, p_is_template BOOLEAN)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_project_id UUID;
  old_wbs        RECORD;
  wbs_mapping    JSONB := '{}'::JSONB;
  new_wbs_id     UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = source_id
      AND (p.created_by = auth.uid() OR public.is_project_member(p.id))
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO projects (org_id, name, description, status, start_date, end_date, budget_hours, created_by, is_template)
  SELECT org_id, new_name, description, 'draft', start_date, end_date, budget_hours, auth.uid(), p_is_template
  FROM projects
  WHERE id = source_id
  RETURNING id INTO new_project_id;
  -- trg_projects_creator_admin adds the caller as Admin of the clone

  -- Parents before children so parent_id can be remapped
  FOR old_wbs IN
    SELECT * FROM wbs_elements WHERE project_id = source_id ORDER BY level ASC, sort_order ASC
  LOOP
    new_wbs_id  := gen_random_uuid();
    wbs_mapping := wbs_mapping || jsonb_build_object(old_wbs.id::text, new_wbs_id::text);

    INSERT INTO wbs_elements (id, project_id, parent_id, wbs_code, level, name, description, status, phase,
                              effort_hours, start_date, end_date, assigned_to, sort_order, created_by)
    VALUES (
      new_wbs_id,
      new_project_id,
      CASE WHEN old_wbs.parent_id IS NULL THEN NULL
           ELSE (wbs_mapping ->> old_wbs.parent_id::text)::UUID END,
      old_wbs.wbs_code, old_wbs.level, old_wbs.name, old_wbs.description, old_wbs.status, old_wbs.phase,
      old_wbs.effort_hours, old_wbs.start_date, old_wbs.end_date, old_wbs.assigned_to, old_wbs.sort_order,
      auth.uid()
    );

    INSERT INTO resources (project_id, wbs_element_id, user_id, effort_allocated_h, role_label)
    SELECT new_project_id, new_wbs_id, user_id, effort_allocated_h, role_label
    FROM resources
    WHERE wbs_element_id = old_wbs.id;
  END LOOP;

  RETURN new_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clone_project(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clone_project(UUID, TEXT, BOOLEAN) TO authenticated;

-- ─── 6. get_shared_project (public client share link) ────────
CREATE OR REPLACE FUNCTION public.get_shared_project(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj RECORD;
  wbs  JSONB;
BEGIN
  SELECT * INTO proj FROM projects WHERE share_token = p_token AND is_shared = true LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(w) ORDER BY w.sort_order), '[]'::jsonb) INTO wbs
  FROM (
    SELECT id, parent_id, wbs_code, level, name, description, status, phase,
           effort_hours, start_date, end_date, sort_order
    FROM wbs_elements
    WHERE project_id = proj.id
  ) w;

  RETURN jsonb_build_object(
    'id',          proj.id,
    'name',        proj.name,
    'description', proj.description,
    'start_date',  proj.start_date,
    'end_date',    proj.end_date,
    'status',      proj.status,
    'wbs',         wbs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_project(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_project(UUID) TO anon, authenticated;

-- ─── 7. get_user_id_by_email (Invite Member) ─────────────────
-- Only project Admins can resolve an email → user id, to limit account
-- enumeration.
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members WHERE user_id = auth.uid() AND role = 'Admin'
  ) THEN
    RAISE EXCEPTION 'Only project admins can look up users' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;

-- Refresh PostgREST's schema cache so the new columns/RPCs are visible immediately
NOTIFY pgrst, 'reload schema';
