
export enum EnergyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum Feeling {
  COMFORTABLE = 'مرتاح',
  HAPPY = 'مبسوط',
  CONTENT = 'راضي',
  NORMAL = 'عادي',
  HEAVY = 'تقيل',
  ANNOYED = 'مضايق',
  ANXIOUS = 'قلقان',
  SAD = 'زعلان',
  CONFUSED = 'متلخبط',
  ANGRY = 'غضبان',
  NUMB = 'مش حاسس بحاجة'
}

export enum Context {
  WORK = 'شغل',
  STUDY = 'دراسة',
  RELATIONSHIP = 'علاقة',
  FAMILY = 'عيلة',
  SELF = 'علاقتي بنفسي',
  HEALTH = 'صحة / جسمي',
  DECISION = 'قرار',
  STRESS = 'ضغط عام'
}

export enum ResponseAction {
  WITHDRAWAL = 'Withdrawal',
  CONFRONTATION = 'Confrontation',
  NEGOTIATION = 'Negotiation',
  SILENCE = 'Silence',
  ACTION = 'Action',
  ANALYSIS = 'Analysis',
  OTHER = 'Other'
}

export enum Outcome {
  HELPFUL = 'helpful',
  HARMFUL = 'harmful',
  UNSURE = 'unsure'
}

export type LearningType = 'Actionable' | 'Reflective';

export interface Pattern {
  id: string;
  label: string;
  createdAt: number;
}

export interface Case {
  id: string;
  timestamp: number;
  energy?: EnergyLevel;
  feeling?: Feeling;
  customFeelingText?: string;
  context?: Context;
  customContextText?: string;
  responseAction?: ResponseAction;
  whatHappened: string;
  howItFelt: string;
  whatIDid: string;
  whatResulted: string;
  learning?: string;
  outcome?: Outcome;
  learningType?: LearningType;
  patternId?: string; 
}

export interface UserSession {
  userId: string;
  username: string;
  encryptionKey: CryptoKey;
  salt: string;
}

export type AppMode = 'INTRO' | 'AUTH' | 'HOME' | 'DAILY' | 'REALITY' | 'CALENDAR' | 'WEEKLY_OVERVIEW' | 'HISTORY' | 'PATTERNS' | 'SETTINGS';
