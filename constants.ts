
import { EnergyLevel, Feeling, Context, ResponseAction, Outcome } from './types.ts';

export const ENERGY_OPTIONS = [
  { value: EnergyLevel.LOW, label: 'Low' },
  { value: EnergyLevel.MEDIUM, label: 'Medium' },
  { value: EnergyLevel.HIGH, label: 'High' }
];

export const FEELING_OPTIONS = Object.values(Feeling);
export const CONTEXT_OPTIONS = Object.values(Context);
export const RESPONSE_OPTIONS = Object.values(ResponseAction);
export const OUTCOME_OPTIONS = [
  { value: Outcome.HELPFUL, label: 'نفعت' },
  { value: Outcome.HARMFUL, label: 'ضرّت' },
  { value: Outcome.UNSURE, label: 'مش متأكد' }
];
