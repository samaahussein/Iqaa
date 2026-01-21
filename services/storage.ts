
import { Case, Pattern, UserSession } from '../types.ts';
import { encryptBlob, decryptBlob } from './crypto.ts';

const STORAGE_KEY = 'iqaa_cases_v2';
const PATTERNS_KEY = 'iqaa_habits_v2';

let currentSession: UserSession | null = null;

export const setSession = (session: UserSession | null) => {
  currentSession = session;
};

/**
 * DATABASE SYNC (Assuming a standard REST API wrapper for Neon)
 */

async function apiRequest(endpoint: string, method: string, body?: any) {
  if (!currentSession) return null;
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'X-User-ID': currentSession.userId 
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch (err) {
    console.error(`DB Request Failed (${endpoint}):`, err);
    return null;
  }
}

/**
 * RETAIN DATA: Restore from Cloud
 */
export const syncFromCloud = async (): Promise<void> => {
  if (!currentSession) return;

  // 1. Restore Cases
  const remoteCases = await apiRequest('cases', 'GET');
  if (remoteCases && Array.isArray(remoteCases)) {
    const decryptedCases: Case[] = [];
    for (const item of remoteCases) {
      try {
        const decrypted = await decryptBlob(item.encrypted_payload, item.iv, currentSession.encryptionKey);
        decryptedCases.push(decrypted);
      } catch (e) { console.error("Could not decrypt case", e); }
    }
    if (decryptedCases.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decryptedCases));
    }
  }

  // 2. Restore Habits
  const remoteHabits = await apiRequest('habits', 'GET');
  if (remoteHabits && Array.isArray(remoteHabits)) {
    const decryptedPatterns: Pattern[] = [];
    for (const item of remoteHabits) {
      try {
        const decrypted = await decryptBlob(item.encrypted_payload, item.iv, currentSession.encryptionKey);
        decryptedPatterns.push(decrypted);
      } catch (e) { console.error("Could not decrypt habit", e); }
    }
    if (decryptedPatterns.length > 0) {
      localStorage.setItem(PATTERNS_KEY, JSON.stringify(decryptedPatterns));
    }
  }
};

/**
 * CASES STORAGE
 */

export const getCases = (): Case[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data).sort((a: Case, b: Case) => b.timestamp - a.timestamp);
  } catch (e) {
    return [];
  }
};

export const saveCase = async (newCase: Case): Promise<void> => {
  const cases = getCases();
  cases.push(newCase);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));

  if (currentSession) {
    const { ciphertext, iv } = await encryptBlob(newCase, currentSession.encryptionKey);
    await apiRequest('cases', 'POST', {
      id: newCase.id,
      encrypted_payload: ciphertext,
      iv: iv,
      timestamp: newCase.timestamp
    });
  }
};

export const deleteCase = async (id: string): Promise<void> => {
  const cases = getCases();
  const filtered = cases.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  if (currentSession) {
    await apiRequest(`cases/${id}`, 'DELETE');
  }
};

export const getTodaysCount = (date?: Date): number => {
  const cases = getCases();
  const dateString = (date || new Date()).toDateString();
  return cases.filter(c => new Date(c.timestamp).toDateString() === dateString).length;
};

export const findMatch = (context: string, feeling: string): Case | null => {
  const cases = getCases();
  const candidates = cases.filter(c => c.learning && c.learning.trim().length > 0);
  const feelingMatches = candidates.filter(c => c.feeling === feeling);

  if (feelingMatches.length === 0) return null;

  feelingMatches.sort((a, b) => {
    const aContextMatch = a.context === context;
    const bContextMatch = b.context === context;
    if (aContextMatch && !bContextMatch) return -1;
    if (!aContextMatch && bContextMatch) return 1;
    return b.timestamp - a.timestamp;
  });

  return feelingMatches[0];
};

/**
 * HABITS (PATTERNS) STORAGE
 */

export const getPatterns = (): Pattern[] => {
  const data = localStorage.getItem(PATTERNS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const savePattern = async (label: string): Promise<void> => {
  const patterns = getPatterns();
  const newPattern: Pattern = {
    id: crypto.randomUUID(),
    label,
    createdAt: Date.now()
  };
  patterns.push(newPattern);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));

  if (currentSession) {
    const { ciphertext, iv } = await encryptBlob(newPattern, currentSession.encryptionKey);
    await apiRequest('habits', 'POST', {
      id: newPattern.id,
      encrypted_payload: ciphertext,
      iv: iv
    });
  }
};

export const deletePattern = async (id: string): Promise<void> => {
  const patterns = getPatterns();
  const filtered = patterns.filter(p => p.id !== id);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(filtered));

  if (currentSession) {
    await apiRequest(`habits/${id}`, 'DELETE');
  }
};
