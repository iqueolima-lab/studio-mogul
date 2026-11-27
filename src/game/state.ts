import {
  INITIAL_MARKETS,
  LEGACY_GENRE_MAP,
  MARKET_GENRES,
  RIVAL_STUDIOS,
  STARTING_CASH,
  STREAMING_CHURN,
  STREAMING_OPS,
} from './constants';
import { overall, refreshPool, starterRoster } from './talent';
import type { Difficulty, ExtState, GameState, Market, Role, StreamingState, Talent } from './types';
import { clamp, clone, gameTick, pickUniqueThemes } from './utils';

const defaultStreaming = (): StreamingState => ({
  built: false,
  launchYear: null,
  regions: 6,
  weeklyOperations: STREAMING_OPS,
  weeklyChurn: STREAMING_CHURN,
});

function defaultExt(): ExtState {
  return {
    genreUnlocked: 8,
    filmTypesUnlocked: 30,
    seasonal: [],
    marketFatigue: {},
    audienceTrust: 58,
    industryEvents: [],
    industryTick: 0,
    lastIndustryEventTick: 0,
    inbox: [],
    trash: [],
    inboxPrefs: { low: false },
    tutorialStep: 0,
    tutorialDone: false,
    insightMilestones: {},
    proTalent: { pool: [], lastRefresh: 1, refreshCount: 0, initialized: false, hiredIds: [] },
    genreRun: { last: '', count: 0 },
    fans: 50,
    genrePrestige: {},
    franchiseProjects: {},
    franchiseHype: {},
    broadcastDeals: [],
    selectedSeriesId: null,
    selectedSeriesSection: 'audience',
    hypeLog: [],
  };
}

export function createMarkets(): Market[] {
  return INITIAL_MARKETS.map((m) => ({ ...m, themes: pickUniqueThemes(10, m.theme) }));
}

export function createNewState(studioName: string, difficulty: Difficulty): GameState {
  const s: GameState = {
    studioName,
    difficulty,
    cash: STARTING_CASH,
    year: 1,
    week: 1,
    rep: 5,
    subs: 0,
    subPrice: 9.99,
    streaming: defaultStreaming(),
    markets: createMarkets(),
    talent: starterRoster(),
    rivals: clone(RIVAL_STUDIOS),
    projects: [],
    yearlyStats: [{ year: 1, rev: 0, exp: 0 }],
    ext: defaultExt(),
  };
  s.ext.industryTick = gameTick(s);
  refreshPool(s, true);
  return s;
}

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = <T extends object>(v: unknown, fallback: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : fallback);

/**
 * Converte qualquer save (inclusive das versões 1.x–2.2 do HTML original) para o formato atual.
 * Reúne o que antes estava espalhado em ensureStreamingState, ensureExtendedState, ensure21, ensure22 etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeState(raw: any): GameState {
  const s = raw as GameState & { franchises?: unknown };
  s.studioName = String(s.studioName || 'Apex Pictures');
  s.difficulty = (['standard', 'indie', 'tycoon'] as const).includes(s.difficulty) ? s.difficulty : 'standard';
  s.cash = num(s.cash, STARTING_CASH);
  s.year = Math.max(1, num(s.year, 1));
  s.week = clamp(num(s.week, 1), 1, 52);
  s.subPrice = num(s.subPrice, 9.99);
  s.yearlyStats = arr(s.yearlyStats);
  if (!s.yearlyStats.length) s.yearlyStats.push({ year: s.year, rev: 0, exp: 0 });
  s.rivals = arr(s.rivals).length ? s.rivals : clone(RIVAL_STUDIOS);
  delete s.franchises;

  // Streaming
  const st = obj<Partial<StreamingState>>(s.streaming, {});
  s.streaming = { ...defaultStreaming(), built: st.built === true, launchYear: st.launchYear ?? null };
  if (!s.streaming.built) s.subs = 0;
  s.subs = num(s.subs, 0);

  // Mercados: temas múltiplos e gêneros com os mesmos nomes dos projetos.
  s.markets = arr<Market>(s.markets).length ? s.markets : createMarkets();
  s.markets.forEach((m) => {
    if (LEGACY_GENRE_MAP[m.genre]) m.genre = LEGACY_GENRE_MAP[m.genre];
    if (!MARKET_GENRES.includes(m.genre)) m.genre = MARKET_GENRES[0];
    if (!Array.isArray(m.themes)) m.themes = pickUniqueThemes(10, m.theme);
  });

  // Extensões
  const e = { ...defaultExt(), ...obj<Partial<ExtState>>(s.ext, {}) } as ExtState;
  e.seasonal = arr(e.seasonal);
  e.marketFatigue = obj(e.marketFatigue, {});
  e.audienceTrust = num(e.audienceTrust, 58);
  e.industryEvents = arr(e.industryEvents);
  e.industryTick = num(e.industryTick, gameTick(s));
  e.lastIndustryEventTick = num(e.lastIndustryEventTick, 0);
  e.inbox = arr(e.inbox);
  e.trash = arr(e.trash);
  e.inboxPrefs = { low: obj<{ low?: boolean }>(e.inboxPrefs, {}).low === true };
  e.tutorialStep = Number.isInteger(e.tutorialStep) ? e.tutorialStep : 0;
  e.tutorialDone = !!e.tutorialDone;
  e.insightMilestones = obj(e.insightMilestones, {});
  const pt = obj<Partial<ExtState['proTalent']>>(e.proTalent, {});
  e.proTalent = {
    pool: arr(pt.pool),
    lastRefresh: num(pt.lastRefresh, 1),
    refreshCount: num(pt.refreshCount, 0),
    initialized: !!pt.initialized,
    hiredIds: arr(pt.hiredIds),
    lastRefreshLabel: pt.lastRefreshLabel,
  };
  e.genreRun = obj(e.genreRun, { last: '', count: 0 });
  e.fans = num(e.fans, 50);
  e.genrePrestige = obj(e.genrePrestige, {});
  e.franchiseProjects = obj(e.franchiseProjects, {});
  e.franchiseHype = obj(e.franchiseHype, {});
  e.broadcastDeals = arr(e.broadcastDeals);
  e.selectedSeriesId = e.selectedSeriesId ?? null;
  e.selectedSeriesSection = (['audience', 'hype', 'ratings', 'report'] as const).includes(e.selectedSeriesSection) ? e.selectedSeriesSection : 'audience';
  e.hypeLog = arr(e.hypeLog);
  // Campos que não são mais usados
  for (const k of ['franchiseLegacy', 'ipRights', 'awardsWon', 'events', 'crew', 'reviews', 'inboxMilestones']) delete (e as unknown as Record<string, unknown>)[k];
  s.ext = e;

  // Projetos: nomes antigos dos campos de receita e campos de indústria 1.9
  s.projects = arr(s.projects);
  s.projects.forEach((p) => {
    const legacy = p as unknown as Record<string, unknown>;
    p.totalGross = num(p.totalGross, num(legacy.totalBruto, 0));
    p.studioNet = num(p.studioNet, num(legacy['studioLíquido'], 0));
    delete legacy.totalBruto;
    delete legacy['studioLíquido'];
    p.teamFatigue = num(p.teamFatigue, 0);
    p.teamCohesion = num(p.teamCohesion, 78);
    p.egoRisk = num(p.egoRisk, 25);
    p.wordOfMouth = num(p.wordOfMouth, 0);
    p.ip = 'Obra original';
  });

  // Talentos: somente profissionais fictícios gerados (o elenco real foi aposentado na 2.0.2).
  s.talent = arr<Talent>(s.talent).filter((t) => t.generated || String(t.id || '').startsWith('gm_'));
  if (!s.talent.length) s.talent = starterRoster();
  s.talent.forEach((t) => {
    if (!Array.isArray(t.attrs)) t.attrs = Array(5).fill(t.star || 40);
    t.fame = num(t.fame, t.star || 5);
    t.overall = num(t.overall, overall(t.role as Role, t.attrs));
    t.retainer = num(t.retainer, 0);
  });

  s.rep = clamp(num(s.rep, 5), 5, 100);
  if (!s.ext.proTalent.initialized) refreshPool(s, true);
  return s;
}
