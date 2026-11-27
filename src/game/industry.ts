/* 1.9 — sistemas de indústria com memória e consequências */
import type { GameEvent, GameState, Project, SimHooks } from './types';
import { addExpense, addRevenue, gameTick, historicalYear, industryTuning } from './utils';
import { money, tr } from '../i18n';

export function addIndustryLog(s: GameState, message: string): void {
  s.ext.industryEvents.unshift({ week: s.week, year: historicalYear(s), message });
  s.ext.industryEvents = s.ext.industryEvents.slice(0, 12);
}

export const genreFatigue = (s: GameState, genre: string): number => Math.max(0, Math.min(100, Number(s.ext.marketFatigue[genre] || 0)));

interface IndustryChoice {
  label: string;
  result: string;
  apply: (s: GameState, p: Project) => void;
}

function industryEvent(projectId: number, title: string, desc: string, logMessage: string, choices: IndustryChoice[]): GameEvent {
  return {
    title,
    desc,
    choices: choices.map((c) => ({
      label: c.label,
      apply: (s) => {
        const p = s.projects.find((x) => x.id === projectId);
        if (p) c.apply(s, p);
        addIndustryLog(s, `${logMessage} — ${c.result}`);
      },
    })),
  };
}

function budgetEvent(s: GameState, p: Project): GameEvent {
  const cost = 0.25 * industryTuning(s.difficulty).eventCost;
  return industryEvent(
    p.id,
    tr('✂️ Pressão no orçamento', '✂️ Budget pressure'),
    tr(`O caixa está apertado durante ${p.title}. A produção precisa de uma resposta, mas cada alternativa tem um custo.`, `Cash is tight during ${p.title}. Production needs an answer, but every option has a cost.`),
    tr(`Pressão financeira em ${p.title}`, `Financial pressure on ${p.title}`),
    [
      {
        label: tr('Reduzir escopo (+US$ 0,35 mi de volta ao caixa; qualidade -3)', 'Reduce scope (US$ 0.35M back to cash; quality -3)'),
        result: tr('escopo reduzido e qualidade ajustada', 'scope reduced and quality adjusted'),
        apply: (st, pr) => {
          pr.budget = Math.max(0.5, pr.budget - 0.35);
          addRevenue(st, 0.35);
          pr.quality = Math.max(35, pr.quality - 3);
        },
      },
      {
        label: tr(`Preservar a visão criativa (${money(cost)})`, `Protect the creative vision (${money(cost)})`),
        result: tr('investimento protegeu a equipe', 'investment protected the team'),
        apply: (st, pr) => {
          addExpense(st, cost);
          pr.teamCohesion = Math.min(100, (pr.teamCohesion || 0) + 4);
        },
      },
      {
        label: tr('Replanejar e aceitar 1 semana extra', 'Reschedule and accept 1 extra week'),
        result: tr('cronograma ampliado para aliviar a pressão', 'schedule extended to ease the pressure'),
        apply: (_st, pr) => {
          pr.weeksLeft++;
          pr.delayWeeks = (pr.delayWeeks || 0) + 1;
          pr.teamFatigue = Math.max(0, (pr.teamFatigue || 0) - 12);
        },
      },
    ],
  );
}

function egoEvent(s: GameState, p: Project): GameEvent {
  const cost = 0.18 * industryTuning(s.difficulty).eventCost;
  return industryEvent(
    p.id,
    tr('🎭 Conflito criativo nos bastidores', '🎭 Creative conflict behind the scenes'),
    tr(`Diferenças de visão entre elenco, direção e equipe técnica estão dificultando decisões em ${p.title}.`, `Differences of vision between cast, director and crew are stalling decisions on ${p.title}.`),
    tr(`Conflito criativo em ${p.title}`, `Creative conflict on ${p.title}`),
    [
      {
        label: tr(`Mediação com produtor (${money(cost)})`, `Mediation with producer (${money(cost)})`),
        result: tr('mediação recuperou a coesão', 'mediation restored cohesion'),
        apply: (st, pr) => {
          addExpense(st, cost);
          pr.teamCohesion = Math.min(100, (pr.teamCohesion || 0) + 18);
          pr.egoRisk = Math.max(5, (pr.egoRisk || 0) - 18);
        },
      },
      {
        label: tr('Dar autonomia criativa à equipe (qualidade +2)', 'Give the team creative freedom (quality +2)'),
        result: tr('acordo criativo fortaleceu o projeto', 'creative agreement strengthened the project'),
        apply: (_st, pr) => {
          pr.teamCohesion = Math.min(100, (pr.teamCohesion || 0) + 7);
          pr.quality = Math.min(98, pr.quality + 2);
          pr.egoRisk = Math.max(0, (pr.egoRisk || 0) - 5);
        },
      },
      {
        label: tr('Impor uma decisão executiva (coesão -12)', 'Make an executive decision (cohesion -12)'),
        result: tr('decisão rápida, com desgaste interno', 'quick decision, with internal strain'),
        apply: (_st, pr) => {
          pr.teamCohesion = Math.max(20, (pr.teamCohesion || 0) - 12);
          pr.egoRisk = Math.max(0, (pr.egoRisk || 0) - 10);
          pr.weeksLeft = Math.max(1, pr.weeksLeft - 1);
        },
      },
    ],
  );
}

function scandalEvent(s: GameState, p: Project): GameEvent {
  const t = industryTuning(s.difficulty);
  const statement = 0.12 * t.eventCost;
  const pause = 0.25 * t.eventCost;
  return industryEvent(
    p.id,
    tr('📰 Crise de imagem', '📰 Reputation crisis'),
    tr(`Uma controvérsia envolvendo alguém ligado a ${p.title} ganhou repercussão. A imprensa está cobrando uma resposta do estúdio.`, `A controversy involving someone attached to ${p.title} has spread. The press is demanding a response from the studio.`),
    tr(`Crise de imagem em ${p.title}`, `Reputation crisis on ${p.title}`),
    [
      {
        label: tr(`Comunicado transparente (${money(statement)}; reputação protegida)`, `Issue a transparent statement (${money(statement)}; reputation protected)`),
        result: tr('resposta transparente conteve a crise', 'transparent response contained the crisis'),
        apply: (st, pr) => {
          addExpense(st, statement);
          st.rep = Math.max(0, Math.min(100, st.rep + 1));
          pr.buzz = Math.max(0, pr.buzz - 2);
        },
      },
      {
        label: tr(`Suspender a campanha (${money(pause)}; expectativa -5)`, `Pause the campaign (${money(pause)}; hype -5)`),
        result: tr('campanha pausada para reduzir exposição', 'campaign paused to reduce exposure'),
        apply: (st, pr) => {
          addExpense(st, pause);
          pr.buzz = Math.max(0, pr.buzz - 5);
          pr.teamCohesion = Math.max(0, (pr.teamCohesion || 0) - 2);
        },
      },
      {
        label: tr('Seguir normalmente (risco reputacional)', 'Proceed as planned (reputational risk)'),
        result: tr('crise se ampliou nas redes e na imprensa', 'crisis spread across social media and the press'),
        apply: (st, pr) => {
          st.rep = Math.max(0, st.rep - 3);
          pr.buzz = Math.max(0, pr.buzz - 8);
        },
      },
    ],
  );
}

/** Recuperação dos mercados, desgaste das equipes e eventos de indústria. */
export function processIndustryWeek(s: GameState, hooks: SimHooks): void {
  s.ext.industryTick = gameTick(s);
  const tuning = industryTuning(s.difficulty);
  Object.keys(s.ext.marketFatigue).forEach((g) => {
    s.ext.marketFatigue[g] = Math.max(0, s.ext.marketFatigue[g] - 1.1 * tuning.marketRecovery);
  });
  const active = s.projects.filter((p) => p.status === 'production');
  active.forEach((p) => {
    p.teamFatigue = Math.min(100, (p.teamFatigue || 0) + 2.2 * tuning.crewFatigue);
    if (p.teamFatigue > 72 && Math.random() < 0.055 * tuning.delayChance) {
      p.weeksLeft++;
      p.delayWeeks = (p.delayWeeks || 0) + 1;
      p.overrun = (p.overrun || 0) + 0.12 * tuning.eventCost;
      p.quality = Math.max(30, p.quality - 1);
      addIndustryLog(s, tr(`Desgaste da equipe atrasou ${p.title} em uma semana.`, `Crew fatigue delayed ${p.title} by a week.`));
    }
    if (p.teamFatigue > 88 && Math.random() < 0.08 * tuning.cohesionLoss) p.teamCohesion = Math.max(20, (p.teamCohesion || 75) - 4);
  });
  if (!active.length || gameTick(s) - s.ext.lastIndustryEventTick < 3 || hooks.isEventOpen()) return;
  const p = active[Math.floor(Math.random() * active.length)];
  let shown = false;
  if (s.cash < 5 && Math.random() < 0.22 * tuning.budgetEvent) shown = hooks.showEvent(budgetEvent(s, p));
  else if ((p.egoRisk || 25) > 38 && Math.random() < 0.07 * tuning.egoEvent) shown = hooks.showEvent(egoEvent(s, p));
  else if (Math.random() < 0.018 * tuning.scandalEvent) shown = hooks.showEvent(scandalEvent(s, p));
  if (shown) s.ext.lastIndustryEventTick = gameTick(s);
}
