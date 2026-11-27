/* Rótulos de exibição calculados a partir das chaves gravadas no projeto. */
import { BUDGET_TIER_LABELS, CREW_LABELS, MEDIUM_OPTIONS, MOVIE_LENGTHS, RATINGS, RISK_LABELS, SCRIPT_OPTIONS, SERIES_LENGTHS, VISUAL_STYLES } from './constants';
import { CREW_STAT_LABELS } from './talent';
import type { CrewMetric, Phase, Project } from './types';
import { getLang, tr, trPair } from '../i18n';

export const mediumLabel = (p: Project) => {
  const m = MEDIUM_OPTIONS.find((x) => x.value === p.medium);
  return m ? trPair(m.short) : p.mediumLabel || tr('Produção', 'Production');
};

export const runtimeLabel = (p: Project) => {
  const opt = [...MOVIE_LENGTHS, ...SERIES_LENGTHS].find((x) => x.value === p.length);
  if (opt) return trPair(opt.label);
  return p.episodeRuntime || p.filmRuntime || p.durationLabel || '—';
};

export const scriptLabel = (p: Project) => {
  const o = SCRIPT_OPTIONS.find((x) => x.value === p.script);
  return o ? trPair(o.label) : p.scriptLabel || tr('Em desenvolvimento', 'In development');
};

export const visualLabel = (p: Project) => {
  const v = VISUAL_STYLES.find((x) => x.value === p.visualStyle);
  return v ? trPair(v.label) : p.visualStyle || tr('visual padrão', 'standard visuals');
};

export const tierLabel = (p: Project) => (p.budgetTier ? trPair(BUDGET_TIER_LABELS[p.budgetTier]) : p.budgetTierLabel || tr('Produção', 'Production'));

export const ratingLabel = (p: Project) => {
  const r = RATINGS.find((x) => x.value === p.rating);
  return r ? trPair(r.label) : p.rating || tr('Classificação pendente', 'Rating pending');
};

export const strategyLabel = (p: Project) => (p.strategy === 'streaming' ? tr('Streaming exclusivo', 'Streaming exclusive') : tr('Cinema primeiro', 'Theatrical first'));

export const formatLabel = (p: Project) => (p.format === 'series' ? tr('Série', 'Series') : tr('Filme', 'Film'));

export const phaseName = (ph: Phase) => tr(ph.name, ph.nameEn || ph.name);

export const riskLabel = (risk: string) => (RISK_LABELS[risk] ? trPair(RISK_LABELS[risk]) : risk);

export const crewRoleLabel = (c: CrewMetric) => (c.roleKey ? trPair(CREW_LABELS[c.roleKey]) : c.role);

export function crewMetricLabels(c: CrewMetric): string[] {
  if (!c.roleKey || getLang() !== 'en') return c.metrics.map((m) => m.label);
  return CREW_STAT_LABELS[c.roleKey].en;
}
