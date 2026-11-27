/**
 * Aprovação de projetos (greenlight). Reúne o cálculo de custo e a criação do projeto que no
 * HTML original estavam divididos entre base, 1.x, 1.9, 2.0.1 e 2.1.
 */
import {
  BUDGET_TIER_LABELS,
  CREW_LABELS,
  CREW_ROLES,
  FILM_TYPES,
  GENRE_45,
  MEDIUM_OPTIONS,
  MOVIE_LENGTHS,
  PHASE_TEMPLATES,
  SCRIPT_OPTIONS,
  SERIES_LENGTHS,
  THEMES,
} from './constants';
import { addNotice } from './inbox';
import { crewStats } from './talent';
import type { ActionResult, BudgetTier, Character, CrewRole, Format, GameState, Medium, Phase, Project, Risk, Strategy, Talent } from './types';
import { addExpense, pick, round2 } from './utils';
import { money, tr, trPair } from '../i18n';

export interface GreenlightForm {
  title: string;
  format: Format;
  genre: string;
  theme: string;
  budget: number;
  mkt: number;
  secondaryGenre: string;
  filmType: string;
  medium: Medium;
  length: string;
  visualStyle: string;
  castSize: number;
  episodeCount: number;
  crossover: string;
  characterNotes: string;
  rating: string;
  script: string;
  synopsis: string;
  episodeScripts: string;
  /** id do profissional contratado, ou '' para equipe interna/improviso. */
  crew: Record<CrewRole, string>;
  dirId: string;
  actId: string;
  strategy: Strategy;
}

export const lengthOptions = (format: Format) => (format === 'series' ? SERIES_LENGTHS : MOVIE_LENGTHS);
export const unlockedGenres = (s: GameState) => GENRE_45.slice(0, s.ext.genreUnlocked || 8);
export const unlockedFilmTypes = (s: GameState) => FILM_TYPES.slice(0, s.ext.filmTypesUnlocked || 30);
export const tierFor = (budget: number): BudgetTier => (budget >= 30 ? 'blockbuster' : budget >= 11 ? 'high' : budget >= 5 ? 'medium' : 'indie');
const TARGET_WEEKS: Record<BudgetTier, number> = { indie: 12, medium: 20, high: 32, blockbuster: 52 };
const TIER_COST_SCALE: Record<BudgetTier, number> = { indie: 0.82, medium: 1, high: 1.16, blockbuster: 1.42 };
const TIER_LOAD: Record<BudgetTier, number> = { indie: 0, medium: 0.04, high: 0.12, blockbuster: 0.25 };

export function defaultForm(s: GameState): GreenlightForm {
  const first = (role: string) => s.talent.find((t) => t.role === role)?.id ?? '';
  return {
    title: '',
    format: 'movie',
    genre: unlockedGenres(s)[0],
    theme: THEMES[0],
    budget: 12,
    mkt: 1.5,
    secondaryGenre: 'none',
    filmType: FILM_TYPES[0],
    medium: 'live',
    length: 'feature',
    visualStyle: 'cinematic',
    castSize: 3,
    episodeCount: 8,
    crossover: '',
    characterNotes: '',
    rating: 'Livre',
    script: 'outline',
    synopsis: '',
    episodeScripts: '',
    crew: Object.fromEntries(CREW_ROLES.map((r) => [r, first(r)])) as Record<CrewRole, string>,
    dirId: first('Director'),
    actId: first('Actor'),
    strategy: 'theatrical',
  };
}

const clampInt = (v: number, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

const findTalent = (s: GameState, id: string): Talent | undefined => (id ? s.talent.find((t) => t.id === id) : undefined);
const mediumFactor = (m: Medium) => MEDIUM_OPTIONS.find((x) => x.value === m)?.costFactor ?? 1;
const lengthInfo = (f: GreenlightForm) => lengthOptions(f.format).find((x) => x.value === f.length);

/** Custo inicial total exibido no formulário e cobrado na aprovação. */
export function computeTotal(s: GameState, f: GreenlightForm): number {
  const dir = findTalent(s, f.dirId);
  const act = findTalent(s, f.actId);
  const feeMult = s.difficulty === 'indie' ? 1.2 : 1;
  const dFee = dir ? dir.fee * feeMult * (dir.retainer > 0 ? 0.85 : 1) : 0;
  const aFee = act ? act.fee * feeMult * (act.retainer > 0 ? 0.85 : 1) : 0;
  const prod = dir && /budget/i.test(dir.trait) ? f.budget * 0.9 : f.budget;
  let total = round2(prod + f.mkt + dFee + aFee);

  // Equipe técnica, tipo de produção e sazonalidade de mídia
  CREW_ROLES.forEach((r) => {
    total += findTalent(s, f.crew[r])?.fee ?? 0;
  });
  total += f.budget * (mediumFactor(f.medium) - 1);
  if ((s.week >= 13 && s.week <= 17) || (s.week >= 47 && s.week <= 52)) total += f.mkt * 0.12;
  total = round2(total);

  // 2.1 — escala, duração, elenco e crossover
  const tier = tierFor(f.budget);
  let scale = lengthInfo(f)?.factor ?? 1;
  if (f.format === 'series') scale *= clampInt(f.episodeCount, 6, 100, 8) / 8;
  else scale *= TIER_COST_SCALE[tier];
  const durationAdjustment = Math.max(0, f.budget * (scale - 1) * 0.22);
  const crossoverFee = f.crossover.trim() ? f.budget * 0.08 : 0;
  const cast = clampInt(f.castSize, 1, 30, 3);
  const actors = s.talent.filter((t) => t.role === 'Actor');
  const avgActorFee = actors.length ? actors.reduce((a, t) => a + (Number(t.fee) || 0), 0) / actors.length : 0.35;
  const castFee = Math.max(0, cast - 1) * avgActorFee * 0.55;
  const crewCount = CREW_ROLES.filter((r) => !!f.crew[r]).length;
  const runtimeLoad = f.format === 'series' ? Math.max(0, cast / 3 - 1) * 0.02 : 0;
  const scaleSurcharge = f.budget * (Math.max(0, crewCount - 2) * 0.035 + TIER_LOAD[tier] + runtimeLoad);
  return round2(total + durationAdjustment + crossoverFee + castFee + scaleSurcharge);
}

function buildWorkflow(f: GreenlightForm, totalWeeks: number): Phase[] {
  const budgetScale = f.budget >= 12 ? 1.15 : f.budget <= 2.5 ? 0.9 : 1;
  const mediumScale = MEDIUM_OPTIONS.find((x) => x.value === f.medium)?.scheduleFactor ?? 1;
  const template = PHASE_TEMPLATES[f.medium] ?? PHASE_TEMPLATES.live;
  const weights = template.map(([, , weeks]) => Math.max(1, Math.round(weeks * budgetScale * mediumScale)));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let assigned = 0;
  return template.map(([name, nameEn, , share], i) => {
    const isLast = i === template.length - 1;
    const weeks = isLast ? Math.max(1, totalWeeks - assigned) : Math.max(1, Math.round((totalWeeks * weights[i]) / sum));
    assigned += weeks;
    return { name, nameEn, weeks, share, risk: pick<Risk>(['baixo', 'moderado', 'alto']), elapsed: 0, done: false };
  });
}

const franchiseSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function confirmGreenlight(s: GameState, f: GreenlightForm): ActionResult & { project?: Project } {
  if (f.strategy === 'streaming' && !s.streaming.built)
    return { ok: false, message: tr('Produções exclusivas de streaming exigem uma plataforma própria. Ela só pode ser lançada a partir de 2008, após investimento de US$ 750 milhões.', 'Streaming exclusives require your own platform. It can only launch from 2008 onward, after a US$ 750 million investment.') };
  const dir = findTalent(s, f.dirId);
  const act = findTalent(s, f.actId);
  if (!dir || !act) return { ok: false, message: tr('Escolha um diretor e um protagonista contratados.', 'Choose a hired director and lead actor.') };
  const total = computeTotal(s, f);
  if (s.cash < total) return { ok: false, message: tr('Saldo insuficiente. Escolha um orçamento menor ou uma campanha orgânica.', 'Insufficient funds. Pick a smaller budget or an organic campaign.') };

  if (dir.retainer > 0) dir.retainer--;
  if (act.retainer > 0) act.retainer--;

  let baseQual = 45 + f.budget * 1.8 + (dir.star + act.star) / 10;
  if (dir.affinity === f.genre) baseQual += 8;
  if (act.affinity === f.genre) baseQual += 6;
  if (/visionary/i.test(dir.trait)) baseQual += 8;
  const quality = Math.min(98, Math.round(baseQual));
  addExpense(s, total);

  const crewNames = Object.fromEntries(CREW_ROLES.map((r) => [r, findTalent(s, f.crew[r])?.name ?? ''])) as Record<CrewRole, string>;
  const tier = tierFor(f.budget);
  const len = lengthInfo(f);
  const episodeCount = clampInt(f.episodeCount, 6, 100, 8);
  const castSize = clampInt(f.castSize, 1, 30, 3);
  const scriptBonus = SCRIPT_OPTIONS.find((x) => x.value === f.script)?.bonus ?? 0;
  const secondary = f.secondaryGenre !== 'none' ? f.secondaryGenre : null;

  // Cronograma por escala (2.1)
  const target =
    f.format === 'series' ? Math.round(TARGET_WEEKS[tier] * (len?.schedule ?? 1) * Math.sqrt(episodeCount / 8)) : TARGET_WEEKS[tier];
  const totalWeeks = Math.max(8, target);
  const workflow = buildWorkflow(f, totalWeeks);
  const weeksLeft = workflow.reduce((a, x) => a + x.weeks, 0);

  // Coesão e risco de conflito (1.9)
  const unique = new Set([dir.name, act.name, ...Object.values(crewNames)].filter(Boolean));
  const mismatch = [dir, act].filter((t) => t.affinity && t.affinity !== f.genre).length;
  const cohesion = Math.max(35, Math.min(98, 82 - mismatch * 9 - (unique.size > 5 ? 4 : 0)));

  // Carga de escala da equipe (2.1)
  const selectedCrew = Object.values(crewNames).filter(Boolean).length;
  const teamLoad = Math.max(0, selectedCrew - 2) * 0.035;
  const runtimeLoad = f.format === 'series' ? Math.max(0, episodeCount / 8 - 1) * 0.12 : len?.runtimeLoad ?? 0;
  const mFactor = mediumFactor(f.medium);
  const loadFactor = 1 + teamLoad + Math.max(0, runtimeLoad) + TIER_LOAD[tier];

  const title = f.title.trim() || `${tr('Projeto', 'Project')} #${s.projects.length + 1}`;
  const franchiseKey = title;
  const franchiseId = franchiseSlug(franchiseKey);
  const characters: Character[] = f.characterNotes
    .split(/[,;]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name, i) => ({ name, importance: i === 0 ? 'secundário' : 'terciário', status: 'recorrente' }));

  const p: Project = {
    id: Date.now(),
    title,
    format: f.format,
    genre: f.genre,
    theme: f.theme,
    budget: f.budget,
    mkt: f.mkt,
    strategy: f.strategy,
    dirName: dir.name,
    actName: act.name,
    status: 'production',
    weeksLeft,
    quality,
    buzz: Math.round(f.mkt * 12),
    totalGross: 0,
    studioNet: -total,
    season: f.format === 'series' ? 1 : null,
    secondaryGenre: secondary,
    filmType: f.filmType,
    medium: f.medium,
    ip: 'Obra original',
    rating: f.rating,
    script: f.script,
    scriptScore: Math.min(98, quality + scriptBonus),
    synopsis: f.synopsis.trim(),
    episodeScripts: f.episodeScripts.split('\n').map((x) => x.trim()).filter(Boolean),
    crew: crewNames,
    crewMetrics: CREW_ROLES.map((r) => ({ role: CREW_LABELS[r][0], roleKey: r, name: crewNames[r], metrics: crewStats(crewNames[r], r) })),
    workflow,
    phaseIndex: 0,
    delayWeeks: 0,
    overrun: 0,
    budgetPlan: f.budget,
    // O custo extra do tipo de produção já está no total cobrado; no HTML original ele era cobrado duas vezes.
    formatSurcharge: round2(f.budget * (mFactor - 1)),
    productionCostMultiplier: mFactor * loadFactor,
    totalWeeks: weeksLeft,
    teamFatigue: 0,
    teamCohesion: cohesion,
    egoRisk: Math.max(12, Math.min(82, Math.round(22 + (100 - cohesion) * 0.8 + Math.random() * 18))),
    wordOfMouth: 0,
    castSize,
    baseSeasonBudget: f.budget,
    budgetTier: tier,
    visualStyle: f.visualStyle,
    episodeCount: f.format === 'series' ? episodeCount : null,
    length: f.length,
    episodeRuntime: f.format === 'series' ? len?.runtime ?? null : null,
    filmRuntime: f.format !== 'series' ? len?.runtime ?? null : null,
    crossoverTarget: f.crossover.trim(),
    recurringCharacters: f.characterNotes.trim(),
    scaleScheduleWeeks: target,
    scaleCost: round2(f.budget * (teamLoad + Math.max(0, runtimeLoad) + TIER_LOAD[tier])),
    createdYear: s.year,
    franchiseType: f.format === 'series' ? 'series' : 'film',
    franchiseKey,
    franchiseId,
    characterRoster: characters,
  };
  p.totalProductionCost = round2(p.budget * (p.productionCostMultiplier || 1) + (p.scaleCost || 0));

  // Registro de universos e crossover (2.1)
  const registry = s.ext.franchiseProjects;
  registry[franchiseId] = registry[franchiseId] || { name: franchiseKey, entries: [], characters: [] };
  registry[franchiseId].entries.push({ title, type: p.franchiseType, genre: p.genre, season: p.season || 1, year: s.year });
  registry[franchiseId].characters.push(...characters);
  const cross = f.crossover.trim();
  if (cross) {
    const target = Object.keys(registry).find((k) => k !== franchiseId && (k === franchiseSlug(cross) || registry[k].name.toLowerCase() === cross.toLowerCase()));
    p.crossoverWith = cross;
    p.crossoverBonus = target ? 8 : 3;
    p.buzz = Math.min(100, p.buzz + p.crossoverBonus);
    p.quality = Math.min(98, p.quality + (target ? 3 : 1));
    if (target) {
      registry[target].crossovers = [...(registry[target].crossovers || []), title];
      p.crossoverCharacters = (registry[target].characters || []).map((c) => ({ ...c, borrowedFrom: cross }));
      p.characterRoster!.push(...p.crossoverCharacters);
    }
  }
  const tierLabel = trPair(BUDGET_TIER_LABELS[tier]);
  p.productionMemo = tr(`Escala ${tierLabel}: cronograma planejado em ${p.weeksLeft} semanas.`, `${tierLabel} scale: planned schedule of ${p.weeksLeft} weeks.`);

  s.projects.unshift(p);

  // Tutorial e avisos (2.0.1)
  if (!s.ext.tutorialDone && !s.ext.tutorialStarted) {
    s.ext.tutorialStarted = true;
    s.ext.tutorialStep = 0;
  }
  addNotice(s, 'medium', tr('Nova produção aprovada', 'New production greenlit'), tr(`${p.title}: produção iniciada. Abra Produção → Pipeline para acompanhar as etapas e consulte a Caixa de entrada para observações técnicas.`, `${p.title}: production has started. Open Production → Pipeline to track phases and check the Inbox for technical insights.`), `greenlight_${p.id}`);
  addNotice(s, 'medium', tr('Estimativa inicial de cronograma', 'Initial schedule estimate'), tr(`${p.title}: ${p.weeksLeft} semanas estimadas. O prazo pode mudar com o formato, as decisões e as condições da equipe.`, `${p.title}: ${p.weeksLeft} weeks estimated. The schedule may change with format, decisions and team conditions.`), `schedule_${p.id}`);
  return { ok: true, project: p, message: tr(`${p.title} aprovado por ${money(total)}.`, `${p.title} greenlit for ${money(total)}.`) };
}
