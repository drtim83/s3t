import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Profile,
  Project,
  WBSElement,
  Discussion,
  ProjectRole,
  SharedProject,
  SharedWBSElement
} from './database.types';

// ─── User Profile Services ────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Profile;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
  const ref = doc(db, 'users', profile.id);
  const existing = await getProfile(profile.id);
  const now = new Date().toISOString();
  const data: Profile = {
    id: profile.id,
    org_id: profile.org_id ?? existing?.org_id ?? 'default-org',
    full_name: profile.full_name ?? existing?.full_name ?? null,
    avatar_url: profile.avatar_url ?? existing?.avatar_url ?? null,
    job_title: profile.job_title ?? existing?.job_title ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

// ─── Project Services ────────────────────────────────────────────────────────

export async function fetchMyProjects(): Promise<Project[]> {
  const q = query(collection(db, 'projects'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
}

export async function fetchProjectsByOrg(orgId: string): Promise<Project[]> {
  const q = query(
    collection(db, 'projects'),
    where('org_id', '==', orgId),
    orderBy('created_at', 'desc')
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
  } catch {
    const fallbackQ = query(collection(db, 'projects'), where('org_id', '==', orgId));
    const snap = await getDocs(fallbackQ);
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export async function fetchProject(projectId: string): Promise<Project> {
  const ref = doc(db, 'projects', projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Project not found');
  return { id: snap.id, ...snap.data() } as Project;
}

export async function createProjectDoc(payload: Partial<Project>, currentUserId?: string): Promise<Project> {
  const now = new Date().toISOString();
  const projectData: Omit<Project, 'id'> = {
    org_id: payload.org_id || 'default-org',
    name: payload.name || 'Untitled Engagement',
    description: payload.description || '',
    status: payload.status || 'draft',
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    budget_hours: payload.budget_hours || 0,
    created_by: currentUserId || null,
    created_at: now,
    updated_at: now,
    is_template: payload.is_template ?? false,
    is_shared: payload.is_shared ?? false,
    share_token: payload.share_token ?? null,
  };

  const docRef = await addDoc(collection(db, 'projects'), projectData);
  const newProject = { id: docRef.id, ...projectData } as Project;

  if (currentUserId) {
    const memberRef = doc(db, 'projects', docRef.id, 'members', currentUserId);
    await setDoc(memberRef, {
      project_id: docRef.id,
      user_id: currentUserId,
      role: 'Admin',
      joined_at: now,
    });
  }

  return newProject;
}

export async function updateProjectDoc(id: string, payload: Partial<Project>): Promise<Project> {
  const ref = doc(db, 'projects', id);
  const updateData = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  await updateDoc(ref, updateData);
  return fetchProject(id);
}

export async function deleteProjectDoc(id: string): Promise<string> {
  const ref = doc(db, 'projects', id);
  await deleteDoc(ref);
  return id;
}

export async function cloneProjectDoc(
  sourceId: string,
  newName: string,
  isTemplate: boolean,
  currentUserId?: string
): Promise<string> {
  const sourceProject = await fetchProject(sourceId);
  const newProject = await createProjectDoc(
    {
      ...sourceProject,
      name: newName,
      is_template: isTemplate,
      is_shared: false,
      share_token: null,
      status: 'draft',
    },
    currentUserId
  );

  const sourceWBS = await fetchWBSElements(sourceId);
  if (sourceWBS.length > 0) {
    const batch = writeBatch(db);
    for (const item of sourceWBS) {
      const rest = { ...item };
      delete (rest as { id?: string }).id;
      const newWBSRef = doc(collection(db, 'wbs_elements'));
      batch.set(newWBSRef, {
        ...rest,
        project_id: newProject.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    await batch.commit();
  }

  return newProject.id;
}

// ─── WBS Services ─────────────────────────────────────────────────────────────

export async function fetchWBSElements(projectId: string): Promise<WBSElement[]> {
  const q = query(
    collection(db, 'wbs_elements'),
    where('project_id', '==', projectId),
    orderBy('sort_order', 'asc')
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WBSElement));
  } catch {
    const fallbackQ = query(collection(db, 'wbs_elements'), where('project_id', '==', projectId));
    const snap = await getDocs(fallbackQ);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as WBSElement));
    return items.sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function fetchWBSElement(wbsId: string): Promise<WBSElement> {
  const ref = doc(db, 'wbs_elements', wbsId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('WBS element not found');
  return { id: snap.id, ...snap.data() } as WBSElement;
}

export async function createWBSElementDoc(
  payload: Partial<WBSElement>
): Promise<WBSElement> {
  const now = new Date().toISOString();
  const data: Omit<WBSElement, 'id'> = {
    project_id: payload.project_id || '',
    parent_id: payload.parent_id || null,
    wbs_code: payload.wbs_code || '1.0',
    level: payload.level || 1,
    name: payload.name || 'New Task',
    description: payload.description || null,
    status: payload.status || 'not_started',
    phase: payload.phase || null,
    effort_hours: payload.effort_hours || 0,
    effort_days: payload.effort_days || 0,
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    assigned_to: payload.assigned_to || null,
    sort_order: payload.sort_order ?? 0,
    created_by: payload.created_by || null,
    created_at: now,
    updated_at: now,
  };

  const docRef = await addDoc(collection(db, 'wbs_elements'), data);
  return { id: docRef.id, ...data } as WBSElement;
}

export async function updateWBSElementDoc(
  wbsId: string,
  payload: Partial<WBSElement>
): Promise<WBSElement> {
  const ref = doc(db, 'wbs_elements', wbsId);
  const updateData = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  await updateDoc(ref, updateData);
  return fetchWBSElement(wbsId);
}

export async function deleteWBSElementDoc(wbsId: string, projectId?: string): Promise<{ id: string; projectId: string }> {
  const ref = doc(db, 'wbs_elements', wbsId);
  await deleteDoc(ref);
  return { id: wbsId, projectId: projectId || '' };
}

// ─── Discussion Services ──────────────────────────────────────────────────────

export async function fetchDiscussions(wbsElementId: string): Promise<Discussion[]> {
  const q = query(
    collection(db, 'discussions'),
    where('wbs_element_id', '==', wbsElementId),
    orderBy('created_at', 'asc')
  );
  try {
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Discussion));
    const root = all.filter(c => !c.parent_comment_id);
    return root.map(parent => ({
      ...parent,
      replies: all.filter(c => c.parent_comment_id === parent.id),
    }));
  } catch {
    const fallbackQ = query(collection(db, 'discussions'), where('wbs_element_id', '==', wbsElementId));
    const snap = await getDocs(fallbackQ);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Discussion));
    const root = all.filter(c => !c.parent_comment_id);
    return root.map(parent => ({
      ...parent,
      replies: all.filter(c => c.parent_comment_id === parent.id),
    }));
  }
}

export async function createDiscussionDoc(payload: Partial<Discussion>): Promise<Discussion> {
  const now = new Date().toISOString();
  const data: Omit<Discussion, 'id'> = {
    wbs_element_id: payload.wbs_element_id || '',
    parent_comment_id: payload.parent_comment_id || null,
    author_id: payload.author_id || '',
    body: payload.body || '',
    is_edited: false,
    created_at: now,
    updated_at: now,
  };
  const docRef = await addDoc(collection(db, 'discussions'), data);
  return { id: docRef.id, ...data } as Discussion;
}

export async function deleteDiscussionDoc(id: string): Promise<string> {
  const ref = doc(db, 'discussions', id);
  await deleteDoc(ref);
  return id;
}

// ─── Shared Project (Client Portal) ───────────────────────────────────────────

export async function fetchSharedProject(token: string): Promise<SharedProject> {
  const q = query(
    collection(db, 'projects'),
    where('share_token', '==', token),
    where('is_shared', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Shared proposal not found or link has expired');

  const pDoc = snap.docs[0];
  const pData = pDoc.data();
  const wbsItems = await fetchWBSElements(pDoc.id);

  const sharedWBS: SharedWBSElement[] = wbsItems.map(item => ({
    id: item.id,
    parent_id: item.parent_id,
    wbs_code: item.wbs_code,
    level: item.level,
    name: item.name,
    description: item.description,
    status: item.status,
    phase: item.phase,
    effort_hours: item.effort_hours,
    start_date: item.start_date,
    end_date: item.end_date,
    sort_order: item.sort_order,
  }));

  return {
    id: pDoc.id,
    name: pData.name,
    description: pData.description,
    status: pData.status,
    start_date: pData.start_date || null,
    end_date: pData.end_date || null,
    wbs: sharedWBS,
  };
}

// ─── Project Members ──────────────────────────────────────────────────────────

export interface FirestoreProjectMember {
  user_id: string;
  role: ProjectRole;
  profiles: {
    full_name: string | null;
    job_title: string | null;
    avatar_url: string | null;
  } | null;
  auth_email?: string;
}

export async function fetchProjectMembers(projectId: string): Promise<FirestoreProjectMember[]> {
  const snap = await getDocs(collection(db, 'projects', projectId, 'members'));
  const members = snap.docs.map(d => ({ user_id: d.id, ...d.data() } as { user_id: string; role: ProjectRole }));

  const enriched: FirestoreProjectMember[] = [];
  for (const m of members) {
    const profile = await getProfile(m.user_id);
    enriched.push({
      user_id: m.user_id,
      role: m.role,
      profiles: profile ? {
        full_name: profile.full_name,
        job_title: profile.job_title,
        avatar_url: profile.avatar_url,
      } : null,
    });
  }
  return enriched;
}

export async function updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<void> {
  const ref = doc(db, 'projects', projectId, 'members', userId);
  await updateDoc(ref, { role });
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const ref = doc(db, 'projects', projectId, 'members', userId);
  await deleteDoc(ref);
}

export async function addMemberByEmail(projectId: string, email: string, role: ProjectRole): Promise<void> {
  const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error(`No user registered with email: ${email}`);
  }
  const userId = snap.docs[0].id;
  const memberRef = doc(db, 'projects', projectId, 'members', userId);
  await setDoc(memberRef, {
    project_id: projectId,
    user_id: userId,
    role,
    joined_at: new Date().toISOString(),
  });
}
