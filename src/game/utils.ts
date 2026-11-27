import { FIRST_YEAR, MONTHS_EN, MONTHS_PT, THEMES } from './constants';
import { getLang } from '../i18n';
import type { Difficulty, GameState } from './types';

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
export const round2 = (v: number): number => +v.toFixed(2);
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Sorteia `count` temas distintos, opcionalmente fixando um deles. */
export function pickUniqueThemes(count: number, pinned?: string): string[] {
  const pool = THEMES.filter((t) => t !== pinned);
  const chosen = pinned && THEMES.includes(pinned) ? [pinned] : [];
  while (chosen.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
}

/** O ano 1 da campanha equivale a 1960; 2008 é o ano 49. */
export const historicalYear = (s: Pick<GameState, 'year'>): number => FIRST_YEAR - 1 + (s.year || 1);

export function monthLabel(week: number): string {
  const i = Math.min(12, Math.floor((week - 1) / 4));
  return getLang() === 'en' ? MONTHS_EN[i] : MONTHS_PT[i];
}

/** Contador absoluto de semanas usado pelos sistemas 2.x (ano 1, semana 1 = 1). */
export const tickNow = (s: GameState): number => ((s.year || 1) - 1) * 52 + (s.week || 1);
/** Contador usado pelos sistemas de indústria 1.9 (mantido para compatibilidade de saves). */
export const gameTick = (s: GameState): number => (s.year || 1) * 52 + (s.week || 1);

export function addRevenue(s: GameState, amount: number): void {
  s.cash += amount;
  s.yearlyStats[s.yearlyStats.length - 1].rev += amount;
}

export function addExpense(s: GameState, amount: number): void {
  s.cash -= amount;
  s.yearlyStats[s.yearlyStats.length - 1].exp += amount;
}

export const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function slug(v: string | undefined): string {
  return (
    String(v || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'obra-original'
  );
}

export interface IndustryTuning {
  marketGain: number;
  marketRecovery: number;
  crewFatigue: number;
  delayChance: number;
  cohesionLoss: number;
  budgetEvent: number;
  egoEvent: number;
  scandalEvent: number;
  legacyBoost: number;
  franchiseWear: number;
  franchiseFatigue: number;
  wordOfMouth: number;
  eventCost: number;
}

/** 2.0.0 — calibração dos sistemas de indústria por dificuldade. */
export function industryTuning(difficulty: Difficulty): IndustryTuning {
  if (difficulty === 'indie')
    return { marketGain: 1.24, marketRecovery: 0.78, crewFatigue: 1.24, delayChance: 1.28, cohesionLoss: 1.22, budgetEvent: 1.28, egoEvent: 1.18, scandalEvent: 1.18, legacyBoost: 0.92, franchiseWear: 1.18, franchiseFatigue: 1.22, wordOfMouth: 0.92, eventCost: 1.18 };
  if (difficulty === 'tycoon')
    return { marketGain: 0.76, marketRecovery: 1.28, crewFatigue: 0.76, delayChance: 0.68, cohesionLoss: 0.72, budgetEvent: 0.62, egoEvent: 0.78, scandalEvent: 0.78, legacyBoost: 1.14, franchiseWear: 0.78, franchiseFatigue: 0.76, wordOfMouth: 1.14, eventCost: 0.88 };
  return { marketGain: 1, marketRecovery: 1, crewFatigue: 1, delayChance: 1, cohesionLoss: 1, budgetEvent: 1, egoEvent: 1, scandalEvent: 1, legacyBoost: 1, franchiseWear: 1, franchiseFatigue: 1, wordOfMouth: 1, eventCost: 1 };
}
