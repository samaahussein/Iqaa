
import { Case, Pattern, UserSession } from '../types.ts';
import { encryptBlob, decryptBlob } from './crypto.ts';

const STORAGE_KEY = 'iqaa_cases_v2';
const PATTERNS_KEY = 'iqaa_habits_v2';

let currentSession: UserSession | null = null;

export const setSession = (session: UserSession | null) => {
  currentSession = session;
};

async function apiRequest(endpoint: string, method: string, body?: any) {
  if (!currentSession || currentSession.userId === 'local-user') return null;
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'X-User-ID': currentSession.userId 
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

export const syncFromCloud = async (): Promise<void> => {
  if (!currentSession || currentSession.userId === 'local-user') return;
  const remoteCases = await apiRequest('cases', 'GET');
  if (remoteCases && Array.isArray(remoteCases)) {
    const decryptedCases: Case[] = [];
    for (const item of remoteCases) {
      try {
        const decrypted = await decryptBlob(item.encrypted_payload, item.iv, currentSession.encryptionKey);
        decryptedCases.push(decrypted);
      } catch (e) {}
    }
    if (decryptedCases.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(decryptedCases));
  }
};

export const getCases = (): Case[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data).sort((a: Case, b: Case) => b.timestamp - a.timestamp);
  } catch (e) { return []; }
};

export const saveCase = async (newCase: Case): Promise<void> => {
  const cases = getCases();
  cases.push(newCase);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  if (currentSession && currentSession.userId !== 'local-user') {
    const { ciphertext, iv } = await encryptBlob(newCase, currentSession.encryptionKey);
    await apiRequest('cases', 'POST', { id: newCase.id, encrypted_payload: ciphertext, iv, timestamp: newCase.timestamp });
  }
};

export const deleteCase = async (id: string): Promise<void> => {
  const cases = getCases();
  const filtered = cases.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  if (currentSession && currentSession.userId !== 'local-user') await apiRequest(`cases/${id}`, 'DELETE');
};

export const getTodaysCount = (date?: Date): number => {
  const cases = getCases();
  const dateString = (date || new Date()).toDateString();
  return cases.filter(c => new Date(c.timestamp).toDateString() === dateString).length;
};

export const findMatch = (context: string, feeling: string): Case | null => {
  const cases = getCases();
  const candidates = cases.filter(c => c.learning && c.learning.trim().length > 0 && c.feeling === feeling);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const aMatch = a.context === context ? 1 : 0;
    const bMatch = b.context === context ? 1 : 0;
    return bMatch - aMatch || b.timestamp - a.timestamp;
  });
  return candidates[0];
};

export const getPatterns = (): Pattern[] => {
  const data = localStorage.getItem(PATTERNS_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePattern = async (label: string): Promise<void> => {
  const patterns = getPatterns();
  const newPattern: Pattern = { id: crypto.randomUUID(), label, createdAt: Date.now() };
  patterns.push(newPattern);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
  if (currentSession && currentSession.userId !== 'local-user') {
    const { ciphertext, iv } = await encryptBlob(newPattern, currentSession.encryptionKey);
    await apiRequest('habits', 'POST', { id: newPattern.id, encrypted_payload: ciphertext, iv });
  }
};

export const deletePattern = async (id: string): Promise<void> => {
  const patterns = getPatterns();
  const filtered = patterns.filter(p => p.id !== id);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(filtered));
  if (currentSession && currentSession.userId !== 'local-user') await apiRequest(`habits/${id}`, 'DELETE');
};
