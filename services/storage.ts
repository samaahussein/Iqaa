
import { Case, Outcome, Pattern } from '../types';

const STORAGE_KEY = 'mirror_cases_v1';
const PATTERNS_KEY = 'mirror_patterns_v1';
const API_URL_KEY = 'iqaa_sheets_api_url';

export const getApiUrl = () => localStorage.getItem(API_URL_KEY) || '';
export const setApiUrl = (url: string) => localStorage.setItem(API_URL_KEY, url);

export const saveCase = (newCase: Case): void => {
  const cases = getCases();
  cases.push(newCase);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  
  const apiUrl = getApiUrl();
  if (apiUrl) {
    syncToSheets(apiUrl, 'Cases', [
      newCase.id, 
      new Date(newCase.timestamp).toLocaleString('ar-EG'),
      newCase.energy || '', 
      newCase.feeling || '', 
      newCase.context || '', 
      newCase.whatHappened, 
      newCase.howItFelt, 
      newCase.whatIDid, 
      newCase.whatResulted, 
      newCase.learning || '', 
      newCase.learningType || '', 
      newCase.patternId || ''
    ]);
  }
};

export const updateLearning = (id: string, newLearning: string): void => {
  const cases = getCases();
  const index = cases.findIndex(c => c.id === id);
  if (index !== -1) {
    cases[index].learning = newLearning;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  }
};

export const deleteCase = (id: string): void => {
  const cases = getCases();
  const filtered = cases.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getCases = (): Case[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse storage', e);
    return [];
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

export const getPatterns = (): Pattern[] => {
  const data = localStorage.getItem(PATTERNS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const savePattern = (label: string): void => {
  const patterns = getPatterns();
  const newPattern: Pattern = {
    id: crypto.randomUUID(),
    label,
    createdAt: Date.now()
  };
  patterns.push(newPattern);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));

  const apiUrl = getApiUrl();
  if (apiUrl) {
    syncToSheets(apiUrl, 'Patterns', [newPattern.id, newPattern.label, new Date(newPattern.createdAt).toLocaleString('ar-EG')]);
  }
};

export const deletePattern = (id: string): void => {
  const patterns = getPatterns();
  const filtered = patterns.filter(p => p.id !== id);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(filtered));
};

async function syncToSheets(url: string, type: 'Cases' | 'Patterns', values: any[]) {
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, values })
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

export const syncAllToSheets = async () => {
  const url = getApiUrl();
  if (!url) return;
  
  const cases = getCases();
  const patterns = getPatterns();
  
  for (const c of cases) {
    await syncToSheets(url, 'Cases', [c.id, new Date(c.timestamp).toLocaleString('ar-EG'), c.energy || '', c.feeling || '', c.context || '', c.whatHappened, c.howItFelt, c.whatIDid, c.whatResulted, c.learning || '', c.learningType || '', c.patternId || '']);
  }
  
  for (const p of patterns) {
    await syncToSheets(url, 'Patterns', [p.id, p.label, new Date(p.createdAt).toLocaleString('ar-EG')]);
  }
};
