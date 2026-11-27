export type Difficulty = 'standard' | 'indie' | 'tycoon';
export type SimMode = 'manual' | 'auto15';
export type Role =
  | 'Director'
  | 'Actor'
  | 'writer'
  | 'producer'
  | 'cinematography'
  | 'editor'
  | 'composer'
  | 'animation';
export type CrewRole = 'writer' | 'producer' | 'cinematography' | 'editor' | 'composer' | 'animation';
export type Format = 'movie' | 'series';
export type Strategy = 'theatrical' | 'streaming';
export type Medium = 'live' | 'western_animation' | 'anime' | 'hybrid' | 'stopmotion' | 'documentary';
export type BudgetTier = 'indie' | 'medium' | 'high' | 'blockbuster';
export type Risk = 'baixo' | 'moderado' | 'alto';
export type NoticeLevel = 'low' | 'medium' | 'high';
export type SeriesSection = 'audience' | 'hype' | 'ratings' | 'report';
export type DealType = 'broadcast' | 'toys' | 'consumer' | 'park';
export type HypeKind = 'teaser' | 'trailer' | 'press';

export interface Talent {
  id: string;
  name: string;
  role: Role;
  star: number;
  overall: number;
  attrs: number[];
  fame: number;
  fee: number;
  affinity: string;
  trait: string;
  retainer: number;
  tier: number;
  ageQuarters: number;
  age: number;
  retired?: boolean;
  generated: true;
  starter?: boolean;
  hiredAt?: number;
}

export interface Market {
  id: string;
  name: string;
  size: number;
  locCost: number;
  unlocked: boolean;
  genre: string;
  theme: string;
  themes: string[];
}

export interface RivalHit {
  title: string;
  studio: string;
  gross: number;
}

export interface Rival {
  name: string;
  cash: number;
  rep: number;
  hits: RivalHit[];
}

export interface Phase {
  name: string;
  nameEn?: string;
  weeks: number;
  share: number;
  risk: Risk;
  elapsed: number;
  done: boolean;
}

export interface Metric {
  label: string;
  value: number;
}

export interface CrewMetric {
  role: string;
  roleKey?: CrewRole;
  name: string;
  metrics: Metric[];
}

export interface Character {
  name: string;
  importance: string;
  status: string;
  borrowedFrom?: string;
}

export interface Project {
  id: number;
  title: string;
  format: Format;
  genre: string;
  theme: string;
  budget: number;
  mkt: number;
  strategy: Strategy;
  dirName: string;
  actName: string;
  status: 'production' | 'released';
  weeksLeft: number;
  quality: number;
  buzz: number;
  totalGross: number;
  studioNet: number;
  season: number | null;
  runWeeks?: number;
  marketMult?: number;
  weeklyBase?: number;

  // Produção (1.x / 2.1)
  secondaryGenre?: string | null;
  filmType?: string;
  medium?: Medium;
  ip?: string;
  rating?: string;
  script?: string;
  scriptScore?: number;
  synopsis?: string;
  episodeScripts?: string[];
  crew?: Partial<Record<CrewRole, string>>;
  crewMetrics?: CrewMetric[];
  workflow?: Phase[];
  phaseIndex?: number;
  delayWeeks?: number;
  overrun?: number;
  budgetPlan?: number;
  productionCostMultiplier?: number;
  formatSurcharge?: number;
  totalWeeks?: number;
  teamFatigue?: number;
  teamCohesion?: number;
  egoRisk?: number;
  wordOfMouth?: number;
  castSize?: number;
  baseSeasonBudget?: number;
  budgetTier?: BudgetTier;
  visualStyle?: string;
  episodeCount?: number | null;
  length?: string;
  episodeRuntime?: string | null;
  filmRuntime?: string | null;
  crossoverTarget?: string;
  recurringCharacters?: string;
  scaleScheduleWeeks?: number;
  scaleCost?: number;
  totalProductionCost?: number;
  createdYear?: number;
  franchiseType?: 'series' | 'film';
  franchiseKey?: string;
  franchiseId?: string;
  characterRoster?: Character[];
  crossoverWith?: string;
  crossoverBonus?: number;
  crossoverCharacters?: Character[];
  productionMemo?: string;
  renewalCost?: number;

  // Lançamento
  seasonalWindow?: string;
  seasonalBoost?: number;
  isSequel?: boolean;
  marketFatigueAtRelease?: number;
  audienceTrustAtRelease?: number;
  franchiseHypeAtRelease?: number;
  franchiseHypeAfter?: number;
  audienceScore?: number;
  criticScore?: number;
  genreRepeatCount?: number;
  genreRepetitionPenalty?: number;
  lastExhibitorShare?: number;
  lastDistributorFee?: number;
  flopAudit205?: boolean;

  // Campos de saves antigos (somente leitura)
  mediumLabel?: string;
  durationLabel?: string;
  scriptLabel?: string;
  budgetTierLabel?: string;
}

export interface YearStats {
  year: number;
  rev: number;
  exp: number;
}

export interface StreamingState {
  built: boolean;
  launchYear: number | null;
  regions: number;
  weeklyOperations: number;
  weeklyChurn: number;
}

export interface SeasonalEntry {
  year: number;
  week: number;
  name: string;
  effect: string;
  nameEn?: string;
  effectEn?: string;
}

export interface IndustryLog {
  week: number;
  year: number;
  message: string;
}

export interface Notice {
  id: number;
  level: NoticeLevel;
  title: string;
  message: string;
  year: number;
  week: number;
  created: number;
  kind?: string;
  projectId?: number;
}

export interface FranchiseProject {
  name: string;
  entries: { title: string; type?: string; genre: string; season: number; year: number }[];
  characters: Character[];
  crossovers?: string[];
}

export interface FranchiseHype {
  key: string;
  name: string;
  hype: number;
  awareness: number;
  trust: number;
  entries: number;
  lastReleaseTick: number;
  lastUpdateTick: number;
  announced: number;
  licensed: DealType[];
  cumulativeGross: number;
  history: { title: string; quality: number; score: number; hype: number; year: number; season: number }[];
}

export interface BroadcastDeal {
  id: number;
  seriesId: number;
  seriesTitle: string;
  franchiseKey: string;
  type: DealType;
  name: string;
  advance: number;
  weeklyRoyalty: number;
  paid: number;
  active: boolean;
  signedYear: number;
}

export interface HypeLog {
  year: number;
  week: number;
  message: string;
}

export interface ProTalentMarket {
  pool: Talent[];
  lastRefresh: number;
  refreshCount: number;
  initialized: boolean;
  hiredIds: string[];
  lastRefreshLabel?: string;
}

export interface ExtState {
  genreUnlocked: number;
  filmTypesUnlocked: number;
  seasonal: SeasonalEntry[];
  // 1.9 — indústria
  marketFatigue: Record<string, number>;
  audienceTrust: number;
  industryEvents: IndustryLog[];
  industryTick: number;
  lastIndustryEventTick: number;
  // 2.0.1 — caixa de entrada e tutorial
  inbox: Notice[];
  trash: Notice[];
  inboxPrefs: { low: boolean };
  tutorialStep: number;
  tutorialDone: boolean;
  tutorialStarted?: boolean;
  insightMilestones: Record<string, boolean>;
  // 2.0.2 — mercado de profissionais
  proTalent: ProTalentMarket;
  // 2.1 — escala e franquias
  genreRun: { last: string; count: number };
  fans: number;
  genrePrestige: Record<string, number>;
  franchiseProjects: Record<string, FranchiseProject>;
  // 2.2 — hype e emissoras
  franchiseHype: Record<string, FranchiseHype>;
  broadcastDeals: BroadcastDeal[];
  selectedSeriesId: number | null;
  selectedSeriesSection: SeriesSection;
  hypeLog: HypeLog[];
}

export interface GameState {
  studioName: string;
  difficulty: Difficulty;
  cash: number;
  year: number;
  week: number;
  rep: number;
  subs: number;
  subPrice: number;
  streaming: StreamingState;
  markets: Market[];
  talent: Talent[];
  rivals: Rival[];
  projects: Project[];
  yearlyStats: YearStats[];
  ext: ExtState;
}

export interface EventChoice {
  label: string;
  apply: (s: GameState) => void;
}

export interface GameEvent {
  title: string;
  desc: string;
  choices: EventChoice[];
}

/** Ganchos que a simulação usa para falar com a interface sem depender dela. */
export interface SimHooks {
  /** Tenta abrir um evento; retorna false se já houver outro aberto. */
  showEvent: (event: GameEvent) => boolean;
  isEventOpen: () => boolean;
}

/** Resultado de uma ação do jogador: mensagem opcional para exibir. */
export interface ActionResult {
  ok: boolean;
  message?: string;
}
