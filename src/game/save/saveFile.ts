/**
 * Formato do arquivo de save: um envelope versionado em volta do estado do jogo.
 * Cada mudança incompatível no formato aumenta SCHEMA_VERSION e ganha um passo em MIGRATIONS.
 */
import { GAME_VERSION } from '../constants';
import { normalizeState } from '../state';
import type { GameState } from '../types';
import { historicalYear } from '../utils';

export const SAVE_FORMAT = 'studio-mogul-save';
export const SCHEMA_VERSION = 2;

export interface SaveSummary {
  studioName: string;
  /** Ano histórico (1960…). */
  year: number;
  week: number;
  cash: number;
}

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  schemaVersion: number;
  gameVersion: string;
  savedAt: string;
  summary: SaveSummary;
  state: GameState;
}

export class SaveError extends Error {
  constructor(
    message: string,
    readonly reason: 'invalid' | 'newer',
  ) {
    super(message);
  }
}

export const summarize = (s: GameState): SaveSummary => ({ studioName: s.studioName, year: historicalYear(s), week: s.week, cash: s.cash });

/** Cria o envelope com uma cópia do estado (o jogo pode continuar mudando o original). */
export function toSaveFile(s: GameState): SaveFile {
  return {
    format: SAVE_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    gameVersion: GAME_VERSION,
    savedAt: new Date().toISOString(),
    summary: summarize(s),
    state: structuredClone(s),
  };
}

export const isSaveFile = (v: unknown): v is SaveFile => !!v && typeof v === 'object' && (v as SaveFile).format === SAVE_FORMAT;

/**
 * Passo de migração N → N+1. Recebe o estado no formato da versão N.
 * Versão 1 = estado "cru", sem envelope (saves do localStorage e do HTML original);
 * as correções de campos desses saves ficam em normalizeState, que roda em todo carregamento.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MIGRATIONS: Record<number, (state: any) => any> = {
  1: (state) => state,
};

/** Lê qualquer save conhecido (envelope ou estado cru), aplica as migrações e valida. */
export function readSaveFile(raw: unknown): { state: GameState; savedAt?: string } {
  if (!raw || typeof raw !== 'object') throw new SaveError('Save is not an object', 'invalid');
  let version: number;
  let state: unknown;
  let savedAt: string | undefined;
  if (isSaveFile(raw)) {
    version = Number(raw.schemaVersion);
    state = raw.state;
    savedAt = raw.savedAt;
  } else {
    version = 1;
    state = raw;
  }
  if (!Number.isInteger(version) || version < 1) throw new SaveError('Unknown save version', 'invalid');
  if (version > SCHEMA_VERSION) throw new SaveError('Save comes from a newer game version', 'newer');
  for (let v = version; v < SCHEMA_VERSION; v++) state = MIGRATIONS[v](state);

  const s = state as Partial<GameState> | null;
  if (!s || typeof s !== 'object' || !Array.isArray(s.projects) || typeof s.studioName !== 'string')
    throw new SaveError('Save is missing required fields', 'invalid');
  return { state: normalizeState(state), savedAt };
}
