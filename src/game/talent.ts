/* 2.0.2 — mercado procedural de profissionais genéricos */
import { GENRE_45, type Pair } from './constants';
import type { ActionResult, CrewRole, GameState, Metric, Role, Talent } from './types';
import { addNotice } from './inbox';
import { addExpense, clamp, round2, tickNow } from './utils';
import { getLang, money, tr } from '../i18n';

export const ROLE_LABELS: Record<Role, Pair> = {
  Director: ['Direção', 'Directing'],
  Actor: ['Atuação', 'Acting'],
  writer: ['Roteiro', 'Writing'],
  producer: ['Produção', 'Producing'],
  cinematography: ['Fotografia', 'Cinematography'],
  editor: ['Montagem', 'Editing'],
  composer: ['Composição', 'Music composition'],
  animation: ['Animação/VFX', 'Animation/VFX'],
};

export const ROLE_ATTRS: Record<Role, { pt: string[]; en: string[] }> = {
  Director: { pt: ['Visão autoral', 'Direção de elenco', 'Linguagem visual', 'Ritmo narrativo', 'Gestão de set'], en: ['Auteur vision', 'Directing actors', 'Visual language', 'Narrative pacing', 'Set management'] },
  Actor: { pt: ['Interpretação', 'Versatilidade', 'Química de elenco', 'Expressividade', 'Presença de cena'], en: ['Performance', 'Versatility', 'Cast chemistry', 'Expressiveness', 'Screen presence'] },
  writer: { pt: ['Estrutura dramática', 'Diálogos', 'Personagens', 'Originalidade', 'Ritmo'], en: ['Dramatic structure', 'Dialogue', 'Characters', 'Originality', 'Pacing'] },
  producer: { pt: ['Planejamento', 'Orçamento', 'Negociação', 'Coordenação', 'Gestão de risco'], en: ['Planning', 'Budgeting', 'Negotiation', 'Coordination', 'Risk management'] },
  cinematography: { pt: ['Composição', 'Iluminação', 'Movimento de câmera', 'Paleta visual', 'Domínio técnico'], en: ['Composition', 'Lighting', 'Camera movement', 'Visual palette', 'Technical mastery'] },
  editor: { pt: ['Ritmo', 'Continuidade', 'Clareza narrativa', 'Montagem de ação', 'Montagem emocional'], en: ['Pacing', 'Continuity', 'Narrative clarity', 'Action editing', 'Emotional editing'] },
  composer: { pt: ['Identidade musical', 'Orquestração', 'Temas', 'Integração com imagem', 'Versatilidade'], en: ['Musical identity', 'Orchestration', 'Themes', 'Picture integration', 'Versatility'] },
  animation: { pt: ['Atuação animada', 'Timing', 'Storyboard/layout', 'Supervisão técnica', 'Consistência visual'], en: ['Animated acting', 'Timing', 'Storyboard/layout', 'Technical supervision', 'Visual consistency'] },
};

const FIRST = ['Nina', 'Beto', 'Dora', 'Cadu', 'Luna', 'Theo', 'Mila', 'Ravi', 'Lia', 'Otto', 'Zeca', 'Iris', 'Noah', 'Tainá', 'Caio', 'Maya', 'Gael', 'Yara', 'Bia', 'Enzo', 'Rosa', 'Davi', 'Léo', 'Amara', 'Téo', 'Cora', 'Ícaro', 'Jade', 'Luca', 'Sol'];
const LAST = ['Plano-B', 'Pé-de-Meia', 'Corta-Caminho', 'Quase-Pronto', 'Gambiarra', 'Fita-Crepada', 'Cena-Extra', 'Luz-de-Reserva', 'Ponto-e-Vírgula', 'Take-Dois', 'Meia-Luz', 'Sem-Pressa', 'Mão-na-Massa', 'Papelão', 'Improviso', 'Roteiro-Guardanapo', 'Tripé-Torto', 'Café-Frio', 'Última-Hora', 'Boa-Vontade', 'Olho-Vivo', 'Plano-Sequência', 'Cena-Curta', 'Pós-Crédito'];
const STARTER_NAMES = ['Beto Gambiarra', 'Nina Plano-B', 'Cadu Quase-Pronto', 'Dora Improviso', 'Léo Café-Frio', 'Mila Fita-Crepada', 'Ravi Take-Dois', 'Jade Luz-de-Reserva', 'Theo Roteiro-Guardanapo', 'Iris Tripé-Torto'];
const STARTER_ROLES: Role[] = ['Director', 'Director', 'Actor', 'Actor', 'writer', 'producer', 'cinematography', 'editor', 'composer', 'animation'];

export const TIER_NAMES: Pair[] = [
  ['Improviso & coragem', 'Improvisation & courage'],
  ['Emergentes', 'Emerging'],
  ['Profissionais estabelecidos', 'Established professionals'],
  ['Nomes reconhecidos', 'Recognised names'],
  ['Elite do mercado', 'Market elite'],
  ['Lendas da indústria', 'Industry legends'],
];
export const TIER_REP = [5, 20, 35, 50, 70, 90];
const FEE_BASE = [0.08, 0.18, 0.38, 0.72, 1.25, 2.0];

const iclamp = (v: number, a = 1, b = 99) => Math.round(clamp(v, a, b));

export function overall(role: Role, attrs: number[], fame = 5): number {
  const weights = role === 'Director' ? [1.25, 1.15, 1.2, 1.1, 0.9] : role === 'Actor' ? [1.2, 1.1, 1.25, 1.1, 1.0] : [1.15, 1.1, 1.05, 1.05, 1.0];
  const sum = attrs.reduce((a, x, i) => a + x * weights[i], 0);
  return iclamp((sum + fame * 0.65) / (weights.reduce((a, x) => a + x, 0) + 0.65));
}

export function makePerson(role: Role, tier: number, index: number, starter = false): Talent {
  const a = FIRST[(index * 7 + tier * 3) % FIRST.length];
  const b = LAST[(index * 11 + tier * 5) % LAST.length];
  const name = starter ? STARTER_NAMES[index % 10] : `${a} ${b}`;
  const attrs = ROLE_ATTRS[role].pt.map((_, i) =>
    iclamp((starter ? 24 : 34 + tier * 10) + ((index * 13 + i * 17 + tier * 7) % 20) - 8, starter ? 12 : 25, 98),
  );
  const fame = iclamp(starter ? 5 + index * 2 : TIER_REP[tier] + ((index * 9) % 14), 5, 99);
  const ov = overall(role, attrs);
  return {
    id: `gm_${role}_${starter ? 'start' : 'mkt'}_${index}_${Math.floor(Math.random() * 1e6)}`,
    name,
    role,
    star: ov,
    overall: ov,
    attrs,
    fame,
    fee: +(FEE_BASE[tier] * (0.72 + (index % 5) * 0.13)).toFixed(2),
    affinity: GENRE_45[(index * 7 + tier * 3) % GENRE_45.length],
    trait: starter ? 'Especialista em improviso e soluções de última hora' : `${TIER_NAMES[tier][0]} • ${ROLE_LABELS[role][0]}`,
    retainer: 0,
    tier,
    ageQuarters: 0,
    age: 22 + ((index * 3) % 35),
    retired: false,
    generated: true,
    starter: starter || undefined,
  };
}

/** Equipe inicial deliberadamente improvisada. */
export const starterRoster = (): Talent[] => STARTER_ROLES.map((r, i) => makePerson(r, 0, i, true));

export function maxTier(s: GameState): number {
  const rep = clamp(s.rep || 5, 5, 100);
  let t = 0;
  TIER_REP.forEach((min, i) => {
    if (rep >= min) t = i;
  });
  return t;
}

export function refreshPool(s: GameState, initial = false): void {
  const max = maxTier(s);
  const roles = Object.keys(ROLE_ATTRS) as Role[];
  const pool: Talent[] = [];
  let n = 0;
  for (let tier = 0; tier <= max; tier++) {
    const count = tier === 0 ? 14 : Math.max(4, Math.round(7 / (tier + 0.5)));
    for (let j = 0; j < count; j++) {
      pool.push(makePerson(roles[(n * 5 + tier * 3) % roles.length], tier, n++, false));
    }
  }
  const market = s.ext.proTalent;
  market.pool = pool;
  market.lastRefresh = tickNow(s);
  market.initialized = true;
  market.refreshCount = (market.refreshCount || 0) + (initial ? 0 : 1);
  market.lastRefreshLabel = `${s.year}/${s.week}`;
}

/**
 * Ciclo trimestral (a cada 12 semanas): profissionais evoluem, alguns se aposentam
 * e o mercado de contratação é renovado. Retorna true quando houve renovação.
 */
export function quarterlyUpdate(s: GameState): boolean {
  const tick = tickNow(s);
  if (!(tick > 1 && (tick - 1) % 12 === 0)) return false;
  s.talent.forEach((t) => {
    t.ageQuarters = (t.ageQuarters || 0) + 1;
    t.age = (t.age || 30) + 0.25;
    if (Math.random() < 0.48) {
      const k = Math.floor(Math.random() * 5);
      t.attrs[k] = iclamp(t.attrs[k] + (Math.random() < 0.2 ? 2 : 1));
      t.overall = overall(t.role, t.attrs, t.fame);
      t.star = t.overall;
    }
    t.fame = iclamp((t.fame || 5) + (s.rep >= t.fame ? 1 : 0), 5, 100);
    if ((t.age || 25) > 62 && Math.random() < 0.1 && s.talent.filter((x) => x.role === t.role).length > 2) t.retired = true;
  });
  s.talent = s.talent.filter((t) => !t.retired);
  refreshPool(s, false);
  return true;
}

export function hireProfessional(s: GameState, id: string): ActionResult {
  const market = s.ext.proTalent;
  const i = market.pool.findIndex((t) => t.id === id);
  if (i < 0) return { ok: false };
  const t = market.pool[i];
  if (t.tier > maxTier(s)) return { ok: false };
  if (s.cash < t.fee) return { ok: false, message: tr('Saldo insuficiente para contratar este profissional.', 'Insufficient funds to hire this professional.') };
  addExpense(s, t.fee);
  s.talent.push({ ...t, retainer: 0, hiredAt: tickNow(s) });
  market.hiredIds.push(t.id);
  market.pool.splice(i, 1);
  const message = `${t.name} — ${roleLabel(t.role)} (${t.overall}/100).`;
  addNotice(s, 'medium', tr('Novo profissional contratado', 'Professional hired'), message);
  return { ok: true, message };
}

/** Contrato de três projetos: adiantamento de 60% do cachê, 15% de desconto nos projetos. */
export function signRetainer(s: GameState, id: string): ActionResult {
  const t = s.talent.find((x) => x.id === id);
  if (!t) return { ok: false };
  const fee = round2(t.fee * 0.6);
  if (s.cash < fee) return { ok: false, message: tr(`É necessário ter ${money(fee)} de adiantamento.`, `You need ${money(fee)} for the upfront retainer.`) };
  addExpense(s, fee);
  t.retainer = 3;
  return { ok: true };
}

export const roleLabel = (role: Role): string => (getLang() === 'en' ? ROLE_LABELS[role]?.[1] : ROLE_LABELS[role]?.[0]) ?? role;

export function traitLabel(t: Talent): string {
  if (t.starter) return tr('Especialista em improviso e soluções de última hora', 'Improvisation specialist and last-minute fixer');
  if (Number.isFinite(t.tier) && TIER_NAMES[t.tier]) return `${tr(...TIER_NAMES[t.tier])} • ${roleLabel(t.role)}`;
  return t.trait;
}

/** Perfil de seis parâmetros: cinco atributos da área + fama. */
export function talentMetrics(t: Talent): Metric[] {
  const labels = ROLE_ATTRS[t.role] ?? ROLE_ATTRS.Actor;
  const names = getLang() === 'en' ? labels.en : labels.pt;
  return [
    ...names.map((label, i) => ({ label, value: t.attrs?.[i] ?? t.star ?? 40 })),
    { label: tr('Fama / reputação', 'Fame / reputation'), value: t.fame || 5 },
  ];
}

export const CREW_STAT_LABELS: Record<CrewRole, { pt: string[]; en: string[] }> = {
  writer: { pt: ['Estrutura dramática', 'Diálogo', 'Construção de personagens', 'Adaptação', 'Ritmo', 'Entrega no prazo'], en: ['Dramatic structure', 'Dialogue', 'Character building', 'Adaptation', 'Pacing', 'On-time delivery'] },
  producer: { pt: ['Planejamento', 'Gestão de orçamento', 'Negociação', 'Coordenação', 'Gestão de risco', 'Entrega'], en: ['Planning', 'Budget management', 'Negotiation', 'Coordination', 'Risk management', 'Delivery'] },
  cinematography: { pt: ['Composição', 'Iluminação', 'Movimento de câmera', 'Paleta visual', 'Integração técnica', 'Consistência'], en: ['Composition', 'Lighting', 'Camera movement', 'Visual palette', 'Technical integration', 'Consistency'] },
  editor: { pt: ['Ritmo', 'Continuidade', 'Clareza narrativa', 'Montagem de ação', 'Montagem emocional', 'Eficiência'], en: ['Pacing', 'Continuity', 'Narrative clarity', 'Action editing', 'Emotional editing', 'Efficiency'] },
  composer: { pt: ['Identidade musical', 'Orquestração', 'Temas de personagem', 'Integração com imagem', 'Versatilidade', 'Prazo'], en: ['Musical identity', 'Orchestration', 'Character themes', 'Picture integration', 'Versatility', 'Deadline'] },
  animation: { pt: ['Atuação animada', 'Timing', 'Storyboard/layout', 'Supervisão técnica', 'Consistência visual', 'Gestão de pipeline'], en: ['Animated acting', 'Timing', 'Storyboard/layout', 'Technical supervision', 'Visual consistency', 'Pipeline management'] },
};

/** Métricas determinísticas da equipe de um projeto (rótulos em português, como no save). */
export function crewStats(name: string, role: CrewRole): Metric[] {
  return CREW_STAT_LABELS[role].pt.map((label, i) => ({
    label,
    value: Math.max(40, Math.min(99, 60 + ((name.length * (i + 5) + i * 7) % 36))),
  }));
}
