/**
 * @fileOverview Servicio atómico para operaciones CRUD del perfil psicológico.
 * Maneja la persistencia en Firestore con versionamiento semántico (1.0, 1.1, 1.2...).
 *
 * Estructura Firestore:
 *   /users/{userId}/profile/main          → ProfileMain (último perfil + metadata)
 *   /users/{userId}/profile/versions/1.0  → ProfileVersion (snapshot versionado)
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import type { ProfileData, ProfileMain, ProfileVersion } from './types';

// ---------------------------------------------------------------------------
// Version Calculation
// ---------------------------------------------------------------------------

/** Calculates the next minor version: "1.0" → "1.1" → "1.2", etc. */
export function getNextVersion(currentVersion: string | null): string {
  if (!currentVersion) return '1.0';

  const parts = currentVersion.split('.');
  const major = parseInt(parts[0] || '1', 10);
  const minor = parseInt(parts[1] || '0', 10);
  return `${major}.${minor + 1}`;
}

// ---------------------------------------------------------------------------
// Load Operations
// ---------------------------------------------------------------------------

/** Loads the main profile document from Firestore. Returns null if none exists. */
export async function loadProfile(
  firestore: Firestore,
  userId: string,
): Promise<ProfileMain | null> {
  const mainRef = doc(firestore, `users/${userId}/profile`, 'main');
  const snap = await getDoc(mainRef);

  if (!snap.exists()) return null;
  return snap.data() as ProfileMain;
}

/** Lists all profile versions ordered by creation date (newest first). */
export async function loadProfileVersions(
  firestore: Firestore,
  userId: string,
): Promise<ProfileVersion[]> {
  const versionsRef = collection(
    firestore,
    `users/${userId}/profile/main/versions`,
  );
  const q = query(versionsRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map(
    (d) => ({ ...d.data() } as ProfileVersion),
  );
}

/** Loads a specific profile version by its version string (e.g. "1.2"). */
export async function loadProfileVersion(
  firestore: Firestore,
  userId: string,
  version: string,
): Promise<ProfileVersion | null> {
  const versionRef = doc(
    firestore,
    `users/${userId}/profile/main/versions`,
    version,
  );
  const snap = await getDoc(versionRef);

  if (!snap.exists()) return null;
  return snap.data() as ProfileVersion;
}

// ---------------------------------------------------------------------------
// Save Operations
// ---------------------------------------------------------------------------

/**
 * Saves a new profile version to Firestore and updates the main document.
 * Automatically calculates the next version number.
 *
 * @returns The version string that was created (e.g. "1.0", "1.1")
 */
export async function saveProfileVersion(
  firestore: Firestore,
  userId: string,
  profileData: ProfileData,
  chatMessagesAnalyzed: number,
): Promise<string> {
  // 1. Load current main to determine the next version
  const currentMain = await loadProfile(firestore, userId);
  const nextVersion = getNextVersion(currentMain?.currentVersion ?? null);

  // Firebase throws if any property is undefined. JSON stringify/parse strips them.
  const sanitizedProfileData = JSON.parse(JSON.stringify(profileData));

  // 2. Create the versioned snapshot
  const versionDoc: ProfileVersion = {
    version: nextVersion,
    profile: sanitizedProfileData,
    createdAt: Timestamp.now(),
    chatMessagesAnalyzed,
    evolutionSummary: sanitizedProfileData.evolutionSummary,
  };

  const versionRef = doc(
    firestore,
    `users/${userId}/profile/main/versions`,
    nextVersion,
  );
  await setDoc(versionRef, versionDoc);

  // 3. Update the main document with the latest profile
  const mainDoc: ProfileMain = {
    currentVersion: nextVersion,
    latestProfile: sanitizedProfileData,
    lastMessageTimestamp: Date.now(),
  };

  const mainRef = doc(firestore, `users/${userId}/profile`, 'main');
  await setDoc(mainRef, mainDoc);

  return nextVersion;
}
