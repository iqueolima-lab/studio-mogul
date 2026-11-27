/* 2.2 — hype progressivo de franquias, emissoras e licenciamento multiplataforma */
import type { ActionResult, DealType, FranchiseHype, GameState, HypeKind, Project, SeriesSection } from './types';
import { addExpense, addRevenue, historicalYear, slug, tickNow } from './utils';
import { money, tr } from '../i18n';

export const keyFor = (p: Project): string => p.franchiseId || slug(p.franchiseKey || p.title);
const nameFor = (p: Project): string => p.franchiseKey || p.title;

export function ensureFranchise(s: GameState, p: Project): FranchiseHype {
  const k = keyFor(p);
  let f = s.ext.franchiseHype[k];
  if (!f) {
    f = s.ext.franchiseHype[k] = {
      key: k,
      name: nameFor(p),
      hype: Math.max(12, Math.min(45, Math.round((p.buzz || 10) * 0.45))),
      awareness: Math.max(5, Math.round((p.buzz || 10) * 0.35)),
      trust: 50,
      entries: 0,
      lastReleaseTick: 0,
      lastUpdateTick: 0,
      announced: 0,
      licensed: [],
      cumulativeGross: 0,
      history: [],
    };
  }
  return f;
}

export function pushHypeLog(s: GameState, message: string): void {
  s.ext.hypeLog.unshift({ year: historicalYear(s), week: s.week || 1, message });
  s.ext.hypeLog = s.ext.hypeLog.slice(0, 18);
}

const hypeMultiplier = (hype: number) => 0.72 + Math.max(0, Math.min(100, hype)) * 0.0052;

export const audienceScore = (p: Project): number =>
  Math.max(1, Math.min(100, Math.round((Number(p.quality) || 50) * 0.48 + (Number(p.buzz) || 0) * 0.28 + 18 + (p.franchiseHypeAtRelease || 0) * 0.12)));

export const scoreForSeries = (p: Project): number => (Number.isFinite(p.audienceScore) ? (p.audienceScore as number) : audienceScore(p));

/** Chamado no lançamento: aplica o hype acumulado e recalcula o patamar da franquia. */
export function releaseHype(s: GameState, p: Project): void {
  const f = ensureFranchise(s, p);
  const oldHype = f.hype || 0;
  const quality = Number(p.quality) || 50;
  const score = audienceScore(p);
  const tick = tickNow(s);
  const gap = f.lastReleaseTick ? tick - f.lastReleaseTick : 999;
  const performance = Math.round((quality - 58) * 0.48 + (score - 55) * 0.18);
  f.hype = Math.max(0, Math.min(100, Math.round(oldHype + performance + (gap > 52 ? 4 : gap < 16 ? -5 : 0))));
  f.awareness = Math.min(100, Math.round((f.awareness || 0) + 8 + Math.max(0, quality - 60) * 0.18));
  f.trust = Math.max(0, Math.min(100, Math.round((f.trust || 50) + (quality >= 75 ? 4 : quality < 48 ? -8 : -1))));
  f.entries = (f.entries || 0) + 1;
  f.lastReleaseTick = tick;
  f.lastUpdateTick = tick;
  f.announced = 0;
  f.cumulativeGross = (f.cumulativeGross || 0) + (p.totalGross || 0);
  f.history.push({ title: p.title, quality, score, hype: f.hype, year: historicalYear(s), season: p.season || 1 });
  p.franchiseHypeAtRelease = oldHype;
  p.franchiseHypeAfter = f.hype;
  p.audienceScore = score;
  p.criticScore = Math.max(1, Math.min(100, Math.round(quality * 0.78 + (p.buzz || 0) * 0.12 + 8)));
  p.weeklyBase = (p.weeklyBase || 0) * hypeMultiplier(oldHype);
  if (oldHype >= 65) s.rep = Math.min(100, (s.rep || 0) + Math.max(1, Math.round((oldHype - 55) / 18)));
  pushHypeLog(s, tr(`${f.name}: hype pré-lançamento ${oldHype}/100; desempenho ${score}/100; novo patamar ${f.hype}/100.`, `${f.name}: pre-release hype ${oldHype}/100; performance ${score}/100; new level ${f.hype}/100.`));
}

export const HYPE_OPTIONS: Record<HypeKind, { cost: number; gain: number; awareness: number; label: [string, string] }> = {
  teaser: { cost: 0.12, gain: 7, awareness: 5, label: ['teaser oficial', 'official teaser'] },
  trailer: { cost: 0.35, gain: 13, awareness: 10, label: ['trailer de campanha', 'campaign trailer'] },
  press: { cost: 0.22, gain: 9, awareness: 7, label: ['giro de imprensa', 'press tour'] },
};

export function investHype(s: GameState, key: string, kind: HypeKind): ActionResult {
  const f = s.ext.franchiseHype[key];
  const c = HYPE_OPTIONS[kind];
  if (!f || !c) return { ok: false };
  if (s.cash < c.cost) return { ok: false, message: tr('O departamento de marketing solicitou verba. O departamento financeiro solicitou silêncio.', 'Marketing requested a budget. Finance requested silence.') };
  addExpense(s, c.cost);
  f.hype = Math.min(100, (f.hype || 0) + c.gain);
  f.awareness = Math.min(100, (f.awareness || 0) + c.awareness);
  f.announced = (f.announced || 0) + c.gain;
  pushHypeLog(s, tr(`${f.name}: ${c.label[0]} elevou o hype em ${c.gain} pontos.`, `${f.name}: ${c.label[1]} raised hype by ${c.gain} points.`));
  return { ok: true };
}

/** Evolução semanal do hype e pagamento de royalties a cada quatro semanas. */
export function weeklyHype(s: GameState): void {
  const tick = tickNow(s);
  Object.values(s.ext.franchiseHype).forEach((f) => {
    const active = s.projects.filter((p) => keyFor(p) === f.key && p.status === 'production');
    if (active.length) {
      const effort = active.reduce((n, p) => n + ((p.buzz || 0) > 35 ? 0.16 : 0.08), 0);
      f.hype = Math.min(100, (f.hype || 0) + effort);
      f.awareness = Math.min(100, (f.awareness || 0) + effort * 0.55);
    } else if (f.lastReleaseTick && tick - f.lastReleaseTick > 20 && tick - (f.lastUpdateTick || 0) >= 4) {
      f.hype = Math.max(0, (f.hype || 0) - 0.45);
      f.lastUpdateTick = tick;
    }
  });
  if ((s.week || 1) % 4 === 0) {
    s.ext.broadcastDeals
      .filter((d) => d.active && s.ext.franchiseHype[d.franchiseKey])
      .forEach((d) => {
        const royalty = Number(d.weeklyRoyalty) || 0;
        if (royalty > 0) {
          addRevenue(s, royalty);
          d.paid = (d.paid || 0) + royalty;
        }
      });
  }
}

export const releasedSeries = (s: GameState): Project[] =>
  s.projects.filter((p) => p.format === 'series' && p.status === 'released').sort((a, b) => scoreForSeries(b) - scoreForSeries(a));

export function selectedSeries(s: GameState): Project | null {
  const list = releasedSeries(s);
  return list.find((p) => String(p.id) === String(s.ext.selectedSeriesId)) || list[0] || null;
}

export function selectSeries(s: GameState, id: number): void {
  s.ext.selectedSeriesId = id;
  s.ext.selectedSeriesSection = 'audience';
}

export function selectSeriesSection(s: GameState, section: SeriesSection): void {
  s.ext.selectedSeriesSection = section;
}

export const DEAL_TYPES: { type: DealType; name: [string, string]; action: [string, string] }[] = [
  { type: 'broadcast', name: ['Direitos de exibição em TV aberta', 'Free-to-air broadcast rights'], action: ['Licenciar exibição em TV aberta', 'License free-to-air broadcast'] },
  { type: 'toys', name: ['Brinquedos e bonecos', 'Toys and figures'], action: ['Licenciar bonecos e brinquedos', 'License toys and figures'] },
  { type: 'consumer', name: ['Produtos licenciados', 'Licensed consumer products'], action: ['Licenciar produtos e colecionáveis', 'License consumer products'] },
  { type: 'park', name: ['Parques e atrações', 'Theme parks and attractions'], action: ['Licenciar parques e atrações', 'License parks and attractions'] },
];

export function dealValue(s: GameState, p: Project, type: DealType): { advance: number; royalty: number } {
  const f = ensureFranchise(s, p);
  const base = Math.max(0.15, (p.budget || 2) * 0.07);
  const aud = scoreForSeries(p) / 60;
  const hype = 0.45 + (f.hype || 0) / 100;
  const mult = { broadcast: 1.0, toys: 0.72, consumer: 0.88, park: 1.65 }[type];
  const adv = { broadcast: 1.8, toys: 1.25, consumer: 1.45, park: 2.1 }[type];
  return { advance: +(base * aud * hype * mult * adv).toFixed(2), royalty: +(base * aud * hype * mult * 0.035).toFixed(3) };
}

export const hasDeal = (s: GameState, seriesId: number, type: DealType) => s.ext.broadcastDeals.some((d) => d.seriesId === seriesId && d.type === type && d.active);

export function signBroadcastDeal(s: GameState, id: number, type: DealType): ActionResult {
  const p = s.projects.find((x) => x.id === id && x.format === 'series' && x.status === 'released');
  if (!p) return { ok: false };
  if (hasDeal(s, p.id, type))
    return { ok: false, message: tr('Esse direito já está licenciado. A duplicação contratual foi encaminhada ao departamento de paradoxos.', 'These rights are already licensed. Contract duplication has been referred to the paradox department.') };
  const f = ensureFranchise(s, p);
  const val = dealValue(s, p, type);
  const info = DEAL_TYPES.find((d) => d.type === type)!;
  const name = tr(...info.name);
  addRevenue(s, val.advance);
  s.ext.broadcastDeals.push({ id: Date.now() + Math.random(), seriesId: p.id, seriesTitle: p.title, franchiseKey: f.key, type, name, advance: val.advance, weeklyRoyalty: val.royalty, paid: 0, active: true, signedYear: s.year });
  f.licensed.push(type);
  f.hype = Math.min(100, (f.hype || 0) + (type === 'broadcast' ? 4 : 6));
  pushHypeLog(s, tr(`${p.title}: ${name} licenciados por ${money(val.advance)}, mais royalties periódicos.`, `${p.title}: ${name} licensed for ${money(val.advance)}, plus periodic royalties.`));
  return { ok: true };
}
