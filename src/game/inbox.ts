/* 2.0.1 — caixa de entrada de avisos  •  2.0.6 — relatório técnico de fracassos */
import type { GameState, NoticeLevel, Project } from './types';
import { tr } from '../i18n';

const INBOX_LIMIT = 20;

/**
 * Adiciona um aviso. Avisos de baixa importância só entram se o jogador ativou essa opção;
 * `key` evita repetir o mesmo marco. Ao passar de 20 avisos, os mais antigos vão para a lixeira.
 */
export function addNotice(s: GameState, level: NoticeLevel, title: string, message: string, key?: string, extra?: { kind?: string; projectId?: number }): void {
  const ex = s.ext;
  if (level === 'low' && !ex.inboxPrefs.low) return;
  if (key && ex.insightMilestones[key]) return;
  if (key) ex.insightMilestones[key] = true;
  ex.inbox.unshift({ id: Date.now() + Math.random(), level, title, message, year: s.year, week: s.week, created: Date.now(), ...extra });
  if (ex.inbox.length > INBOX_LIMIT) {
    ex.trash.unshift(...ex.inbox.splice(INBOX_LIMIT));
    ex.trash = ex.trash.slice(0, 100);
  }
}

export function archiveInbox(s: GameState): void {
  s.ext.trash.unshift(...s.ext.inbox);
  s.ext.inbox = [];
  s.ext.trash = s.ext.trash.slice(0, 100);
}

export function emptyTrash(s: GameState): void {
  s.ext.trash = [];
}

/** Sinais técnicos semanais sobre produções em andamento. */
export function inspectProductions(s: GameState): void {
  s.projects
    .filter((p) => p.status === 'production')
    .forEach((p) => {
      const key = String(p.id);
      const phase = p.workflow?.[p.phaseIndex || 0];
      const phaseName = phase ? tr(phase.name, phase.nameEn || phase.name) : '';
      const pct = p.totalWeeks ? Math.round(100 * (1 - (p.weeksLeft || 0) / p.totalWeeks)) : 0;
      const fatigue = Math.round(p.teamFatigue || 0);
      if (pct >= 25)
        addNotice(s, 'low', tr('Produção em andamento', 'Production update'), tr(`${p.title}: cerca de ${pct}% do cronograma já foi cumprido. Confira o pipeline para ver a etapa atual.`, `${p.title}: about ${pct}% of the schedule has elapsed. Check the pipeline for the current phase.`), `progress25_${key}`);
      if (phase && (phase.elapsed || 0) === 1)
        addNotice(s, 'medium', tr('Nova etapa iniciada', 'New phase started'), tr(`${p.title}: começou a etapa “${phaseName}”. Observe o risco e o orçamento alocado antes de mudar o plano.`, `${p.title}: the “${phaseName}” phase has started. Review its risk and allocated budget before changing the plan.`), `phase_${key}_${p.phaseIndex || 0}`);
      if (fatigue >= 55)
        addNotice(s, 'medium', tr('Desgaste da equipe aumentando', 'Crew fatigue rising'), tr(`${p.title}: desgaste em ${fatigue}%. Acompanhe coesão e risco de atraso; considere aliviar a pressão se a tendência continuar.`, `${p.title}: fatigue is at ${fatigue}%. Watch cohesion and delay risk; consider easing pressure if the trend continues.`), `fatigue55_${key}`);
      if (fatigue >= 75)
        addNotice(s, 'high', tr('Risco elevado de atraso', 'High delay risk'), tr(`${p.title}: desgaste chegou a ${fatigue}%. A chance de atraso aumentou; revise cronograma e decisões de equipe.`, `${p.title}: fatigue reached ${fatigue}%. Delay risk has increased; review the schedule and team decisions.`), `fatigue75_${key}`);
      if ((p.overrun || 0) > Math.max(0.25, (p.budget || 1) * 0.08))
        addNotice(s, 'high', tr('Pressão de orçamento', 'Budget pressure'), tr(`${p.title}: custos adicionais de US$ ${(p.overrun || 0).toFixed(2)} mi já merecem atenção em relação ao orçamento-base.`, `${p.title}: additional costs of US$ ${(p.overrun || 0).toFixed(2)}M now deserve attention relative to the base budget.`), `overrun_${key}`);
      if ((p.weeksLeft || 0) <= 3)
        addNotice(s, 'medium', tr('Produção perto da conclusão', 'Production nearing completion'), tr(`${p.title}: restam ${p.weeksLeft} semanas estimadas. Prepare distribuição, campanha e janela de lançamento.`, `${p.title}: an estimated ${p.weeksLeft} weeks remain. Prepare distribution, marketing and the release window.`), `nearend_${key}`);
      if (phase && phase.risk === 'alto' && (phase.elapsed || 0) === 0)
        addNotice(s, 'medium', tr('Etapa com risco alto', 'High-risk phase'), tr(`${p.title}: “${phaseName}” está marcada com risco alto. Isso é um alerta para planejar, não uma falha inevitável.`, `${p.title}: “${phaseName}” is marked high risk. This is a planning signal, not an inevitable failure.`), `highrisk_${key}_${p.phaseIndex || 0}`);
    });
}

interface Finding {
  area: string;
  detail: string;
  score: number;
}

function crewMetric(p: Project, role: string, terms: string[]) {
  const crew = (p.crewMetrics || []).find((x) => String(x.role || '').toLowerCase().includes(role));
  if (!crew) return null;
  const found = (crew.metrics || []).filter((m) => terms.some((t) => String(m.label || '').toLowerCase().includes(t)));
  return found.length ? found : null;
}

function technicalAutopsy(p: Project): Finding[] {
  const findings: Finding[] = [];
  const check = (role: string, terms: string[], area: string, joke: string) => {
    const items = crewMetric(p, role, terms);
    if (!items) return;
    const weak = items.filter((x) => Number(x.value) < 64);
    if (weak.length) findings.push({ area, detail: `${weak.map((x) => `${x.label} (${x.value}/100)`).join(', ')}. ${joke}`, score: Math.min(...weak.map((x) => x.value)) });
  };
  check('roteir', ['estrutura', 'diálogo', 'personagens', 'ritmo'], tr('Roteiro', 'Script'), tr('A história solicitou uma estrutura dramática. O departamento responsável enviou um cavalete e encerrou o expediente.', 'The story requested a dramatic structure. The department responsible sent an easel and clocked off.'));
  check('fotografia', ['composição', 'iluminação', 'movimento', 'paleta', 'consistência'], tr('Direção visual', 'Visual direction'), tr('A visão criativa foi aprovada. A imagem apresentou recurso, perdeu o formulário e nunca chegou ao set.', 'The creative vision was approved. The image filed an appeal, lost the form and never reached the set.'));
  check('montagem', ['ritmo', 'continuidade', 'clareza', 'montagem'], tr('Montagem', 'Editing'), tr('Algumas cenas chegaram à montagem sem saber por quê. A ilha de edição abriu uma comissão de inquérito.', 'Some scenes arrived in the edit without knowing why. The editing suite has opened an inquiry.'));
  check('composição musical', ['integração', 'identidade', 'temas', 'orquestração'], tr('Trilha sonora', 'Score'), tr('A trilha e a imagem parecem ter sido contratadas por estúdios diferentes e apresentado crachás falsos na portaria.', 'Score and picture appear to have been hired by different studios and shown fake badges at the gate.'));
  check('animação', ['timing', 'consistência', 'supervisão', 'atuação', 'storyboard'], tr('Animação / VFX', 'Animation / VFX'), tr('O pipeline entregou alguma coisa. A consistência, por sua vez, foi vista pela última vez entrando num táxi.', 'The pipeline delivered something. Consistency, meanwhile, was last seen getting into a taxi.'));
  if ((p.delayWeeks || 0) >= 3)
    findings.push({ area: tr('Cronograma', 'Schedule'), detail: tr(`${p.delayWeeks} semanas de atraso. O calendário apresentou uma reclamação formal e pediu transferência para outro estúdio.`, `${p.delayWeeks} weeks late. The calendar filed a formal complaint and requested a transfer to another studio.`), score: 40 });
  const over = Number(p.overrun || 0);
  const base = Math.max(0.1, Number(p.budget || 1));
  if (over > base * 0.12)
    findings.push({ area: tr('Controle de produção', 'Production control'), detail: tr(`Custo adicional de US$ ${over.toFixed(2)} mi (${((over / base) * 100).toFixed(0)}% do orçamento-base). O dinheiro desapareceu em circunstâncias misteriosas. A contabilidade está cooperando com a investigação, mas não muito.`, `Additional cost of US$ ${over.toFixed(2)}M (${((over / base) * 100).toFixed(0)}% of the base budget). The money vanished in mysterious circumstances. Accounting is cooperating with the investigation, but not much.`), score: 42 });
  if (!findings.length) {
    if (Number(p.quality || 0) < 62)
      findings.push({ area: tr('Execução geral', 'Overall execution'), detail: tr(`Qualidade técnica projetada de ${Math.round(p.quality || 0)}/100. Não houve um desastre isolado. Foi um esforço coletivo, o que é bonito de ver em qualquer área que não seja esta.`, `Projected technical quality of ${Math.round(p.quality || 0)}/100. There was no single disaster. It was a team effort, which is lovely to see in any field except this one.`), score: p.quality || 0 });
    else
      findings.push({ area: tr('Diagnóstico inconclusivo', 'Inconclusive diagnosis'), detail: tr('Os indicadores técnicos não apontam um culpado claro. Mercado, posicionamento ou recepção podem ter pesado mais. A comissão concluiu que o mistério permanece; a comissão também não sabe quem a nomeou.', 'Technical indicators point to no clear culprit. Market, positioning or reception may have weighed more. The committee concluded that the mystery remains; the committee also does not know who appointed it.'), score: 65 });
  }
  return findings.sort((a, b) => a.score - b.score).slice(0, 3);
}

/** Emite o relatório quando a janela de exibição termina sem recuperar o investimento. */
export function createFlopReport(s: GameState, p: Project): void {
  if (p.flopAudit205) return;
  const investment = Number(p.budget || 0) * Number(p.productionCostMultiplier || 1) + Number(p.overrun || 0) + Number(p.mkt || 0);
  const recovered = Number(p.studioNet || 0);
  if (!(investment > 0 && recovered < investment)) return;
  const lines = technicalAutopsy(p).map((f, i) => `${i + 1}. ${f.area}: ${f.detail}`);
  const gap = Math.max(0, investment - recovered);
  const message = tr(
    `O estúdio investiu cerca de US$ ${investment.toFixed(2)} mi e recuperou US$ ${recovered.toFixed(2)} mi. A diferença de US$ ${gap.toFixed(2)} mi foi encaminhada ao Departamento de Desaparecimento de Capital.\n\n${lines.join('\n')}\n\nVeredito: a comissão reconhece o esforço de todos os envolvidos. A comissão também recomenda que ninguém envolvido toque em uma câmera, planilha ou botão de lançamento até segunda ordem.`,
    `The studio invested about US$ ${investment.toFixed(2)}M and recovered US$ ${recovered.toFixed(2)}M. The US$ ${gap.toFixed(2)}M difference has been referred to the Department of Missing Capital.\n\n${lines.join('\n')}\n\nVerdict: the committee acknowledges everyone’s efforts. The committee also recommends that nobody involved touch a camera, spreadsheet or release button until further notice.`,
  );
  addNotice(s, 'high', tr(`🧾 Comissão extraordinária de cinema: ${p.title}`, `🧾 Extraordinary Cinema Committee: ${p.title}`), message, undefined, { kind: 'technical-postmortem', projectId: p.id });
  p.flopAudit205 = true;
}
