import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Profile, Project } from './database.types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Profile;
}

export async function ensureProfile(
  profile: Partial<Profile> & { id: string }
): Promise<Profile> {
  const ref = doc(db, 'users', profile.id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Profile;
    }
    const now = new Date().toISOString();
    const data: Profile = {
      id: profile.id,
      org_id: profile.org_id ?? 'default-org',
      email: profile.email?.toLowerCase() ?? null,
      full_name: profile.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      job_title: profile.job_title ?? null,
      created_at: now,
      updated_at: now,
    };
    tx.set(ref, data);
    return data;
  });
}

export async function upsertProfile(
  profile: Partial<Profile> & { id: string }
): Promise<Profile> {
  const ref = doc(db, 'users', profile.id);
  const existing = await getProfile(profile.id);
  const now = new Date().toISOString();
  const data: Profile = {
    id: profile.id,
    org_id: profile.org_id ?? existing?.org_id ?? 'default-org',
    email: profile.email?.toLowerCase() ?? existing?.email ?? null,
    full_name: profile.full_name ?? existing?.full_name ?? null,
    avatar_url: profile.avatar_url ?? existing?.avatar_url ?? null,
    job_title: profile.job_title ?? existing?.job_title ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const q = query(collection(db, 'projects'), orderBy('updated_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
  } catch {
    const snap = await getDocs(collection(db, 'projects'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
    return items.sort((a, b) =>
      (b.updated_at ?? '').localeCompare(a.updated_at ?? '')
    );
  }
}
