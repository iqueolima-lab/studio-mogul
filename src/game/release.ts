/**
 * Lançamento e exibição. No HTML original o lançamento era uma pilha de seis funções que
 * se embrulhavam (base → 1.x → 2.2 → 1.9 → 2.0.2 → 2.1). Aqui as etapas aparecem em ordem.
 */
import { ensureFranchise, releaseHype } from './franchise';
import { addIndustryLog, genreFatigue } from './industry';
import type { ActionResult, GameState, Project } from './types';
import { addExpense, addRevenue, industryTuning, pickUniqueThemes, round2 } from './utils';
import { money, tr } from '../i18n';

const runLength = (p: Project) => (p.format === 'movie' ? 8 : 10);

/** Janelas sazonais do calendário e os gêneros que cada uma favorece. */
function seasonalBoost(week: number, genres: string): { season: string; boost: number } {
  let boost = 0;
  let season = tr('período regular', 'regular period');
  if (week >= 1 && week <= 8) {
    season = tr('temporada de premiações', 'awards season');
    if (/drama|biografia|histórico|documentário|musical/.test(genres)) boost += 0.1;
  }
  if (week >= 13 && week <= 17) {
    season = tr('temporada de verão', 'summer season');
    if (/ação|aventura|ficção científica|space opera|super-herói|animação infantil/.test(genres)) boost += 0.16;
  }
  if (week >= 18 && week <= 24) {
    season = tr('temporada de festivais', 'festival season');
    if (/drama|documentário|experimental|histórico|romance/.test(genres)) boost += 0.13;
  }
  if (week >= 37 && week <= 43) {
    season = tr('temporada de terror', 'horror season');
    if (/terror|suspense|thriller|mistério|gótico|sobrenatural/.test(genres)) boost += 0.18;
  }
  if (week >= 47 && week <= 52) {
    season = tr('temporada de festas', 'holiday season');
    if (/animação infantil|fantasia|comédia|musical|aventura/.test(genres)) boost += 0.15;
  }
  return { season, boost };
}

export function releaseProject(s: GameState, p: Project): void {
  const ext = s.ext;
  const tuning = industryTuning(s.difficulty);
  const secondary = p.secondaryGenre && p.secondaryGenre !== 'none' ? p.secondaryGenre : '';

  // 2.1 — repetição consecutiva do mesmo gênero
  const run = ext.genreRun;
  if (run.last === p.genre) run.count++;
  else {
    run.last = p.genre;
    run.count = 1;
  }
  const repeatPenalty = run.count >= 3 ? Math.min(0.38, 0.1 + (run.count - 3) * 0.09) : 0;
  p.genreRepeatCount = run.count;
  p.genreRepetitionPenalty = repeatPenalty;

  // 1.9 — fadiga do mercado e boca a boca (o legado de franquias foi substituído pelo hype 2.2)
  p.ip = 'Obra original';
  const fatigue = genreFatigue(s, p.genre);
  const fatiguePenalty = Math.min(0.24, fatigue * 0.0024 * (2 - tuning.marketGain));
  const wordBoost = Math.max(0, Math.min(0.14, (p.quality - 60) * 0.0035 * tuning.wordOfMouth));
  p.isSequel = false;
  p.marketFatigueAtRelease = fatigue;
  p.wordOfMouth = wordBoost;

  // 2.2 — vínculo com a franquia
  const f = ensureFranchise(s, p);
  p.franchiseId = f.key;
  p.franchiseKey = f.name;

  // Streaming só existe com plataforma própria
  const wantsStreaming = p.strategy === 'streaming';
  if (wantsStreaming && !s.streaming.built) p.strategy = 'theatrical';

  // Base — multiplicador dos mercados liberados
  p.status = 'released';
  p.runWeeks = runLength(p);
  let marketMult = 0;
  s.markets
    .filter((m) => m.unlocked)
    .forEach((m) => {
      let mult = m.size;
      if (m.genre === p.genre) mult *= 1.25;
      if (!Array.isArray(m.themes)) m.themes = pickUniqueThemes(10, m.theme);
      if (m.themes.includes(p.theme) || m.theme === p.theme) mult *= 1.2;
      marketMult += mult;
    });
  p.marketMult = marketMult;
  p.weeklyBase = (p.budget * 0.42 + p.mkt * 0.55) * (p.quality / 65) * (1 + p.buzz / 100) * marketMult;
  if (p.strategy === 'streaming') {
    p.weeklyBase *= 0.65; // menos bilheteria direta, mais assinantes
    const activeMarkets = s.markets.filter((m) => m.unlocked).reduce((a, m) => a + m.size, 0);
    const marketingFactor = 1 + Math.min(0.5, (p.mkt || 0) / 30);
    const gain = Math.max(0.03, Math.min(0.9, 0.12 * activeMarkets * (p.quality / 75) * marketingFactor));
    s.subs = +(s.subs + gain).toFixed(3);
  }
  s.rep = Math.min(100, s.rep + Math.round(p.quality / 25));

  // Janela sazonal
  const { season, boost: seasonBoost } = seasonalBoost(s.week, `${p.genre} ${secondary}`.toLowerCase());
  const boost = seasonBoost + (secondary ? 0.035 : 0);
  p.seasonalWindow = season;
  p.seasonalBoost = boost;
  p.weeklyBase *= 1 + boost;

  // 2.2 — hype acumulado da franquia
  releaseHype(s, p);

  // 1.9 — confiança do público, fadiga e boca a boca
  const trustFactor = 0.9 + ext.audienceTrust * 0.002;
  p.audienceTrustAtRelease = ext.audienceTrust;
  p.weeklyBase *= Math.max(0.55, (1 - fatiguePenalty + wordBoost) * trustFactor);
  ext.marketFatigue[p.genre] = Math.min(100, fatigue + (13 + (p.quality >= 80 ? 3 : 0)) * tuning.marketGain);
  if (secondary) ext.marketFatigue[secondary] = Math.min(100, genreFatigue(s, secondary) + 5 * tuning.marketGain);
  const performance = p.quality >= 75 ? 1 : p.quality < 52 ? -1 : 0;
  ext.audienceTrust = Math.max(0, Math.min(100, ext.audienceTrust + (p.quality >= 78 ? 3 : p.quality < 50 ? -5 : 0) + performance));
  addIndustryLog(
    s,
    tr(
      `${p.title}: novo título entrou no mercado; fadiga de ${p.genre}: ${Math.round(ext.marketFatigue[p.genre])}/100.`,
      `${p.title}: new title entered the market; ${p.genre} fatigue: ${Math.round(ext.marketFatigue[p.genre])}/100.`,
    ),
  );

  // 2.1 — penalidade de repetição
  if (repeatPenalty > 0) {
    p.weeklyBase *= 1 - repeatPenalty;
    s.rep = Math.max(0, s.rep - (run.count === 3 ? 2 : 3));
    ext.fans = Math.max(0, ext.fans - (run.count === 3 ? 4 : 6));
    ext.genrePrestige[p.genre] = Math.max(0, (ext.genrePrestige[p.genre] ?? 55) - (run.count === 3 ? 5 : 7));
    addIndustryLog(s, tr(`${p.genre}: repetição consecutiva nº ${run.count}; público e crítica demonstraram sinais de déjà-vu.`, `${p.genre}: consecutive repeat #${run.count}; audiences and critics showed signs of déjà vu.`));
  }
  if (p.franchiseId && ext.franchiseProjects[p.franchiseId])
    ext.franchiseProjects[p.franchiseId].entries.push({ title: p.title, season: p.season || 1, genre: p.genre, year: s.year });
}

/** Receita de uma semana em cartaz: queda semanal, divisão com exibidores e boca a boca. */
export function processWeeklyRelease(s: GameState, p: Project): void {
  const weekIndex = runLength(p) - (p.runWeeks || 0);
  const gross = (p.weeklyBase || 0) * Math.pow(0.76, weekIndex);
  const base = s.difficulty === 'indie' ? 0.42 : s.difficulty === 'tycoon' ? 0.55 : 0.48;
  const effective = base * (weekIndex === 0 ? 1.08 : weekIndex < 3 ? 1.0 : 0.92);
  const distributorFee = 0.08;
  let net = gross * effective * (1 - distributorFee);
  p.totalGross += gross;
  p.lastExhibitorShare = gross * (1 - effective);
  p.lastDistributorFee = gross * effective * distributorFee;
  const mouth = Math.max(0, Math.min(0.14, p.wordOfMouth || 0));
  if (mouth > 0 && net > 0) {
    const extra = net * mouth;
    net += extra;
    p.totalGross += extra / 0.45;
  }
  p.studioNet += net;
  addRevenue(s, net);
}

/** Custo de renovação: escala, episódios e inflação acumulada de 3,5% ao ano. */
export function renewalCost(s: GameState, p: Project): number {
  const age = Math.max(0, (s.year || 1) - (p.createdYear || s.year || 1));
  const inflation = Math.pow(1.035, age);
  const episodes = Math.max(6, p.episodeCount || 8);
  return round2((p.baseSeasonBudget || p.budget) * 0.85 * inflation * (episodes / 8) * (p.productionCostMultiplier || 1));
}

export function renewSeries(s: GameState, id: number): ActionResult {
  const p = s.projects.find((x) => x.id === id);
  if (!p || p.format !== 'series') return { ok: false };
  const cost = renewalCost(s, p);
  if (s.cash < cost)
    return { ok: false, message: tr(`A emissora não aprovou a renovação: são necessários ${money(cost)}, já considerando inflação e escala da temporada.`, `The network declined renewal: ${money(cost)} is required, including inflation and season scale.`) };
  const inflation = Math.pow(1.035, Math.max(0, (s.year || 1) - (p.createdYear || s.year || 1)));
  addExpense(s, cost);
  p.season = (p.season || 1) + 1;
  p.status = 'production';
  p.weeksLeft = Math.max(12, Math.round((p.scaleScheduleWeeks || 20) * inflation));
  p.totalWeeks = p.weeksLeft;
  p.buzz += 12;
  p.budget = round2((p.baseSeasonBudget || p.budget) * inflation);
  p.renewalCost = cost;
  return { ok: true };
}
