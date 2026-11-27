/**
 * Avanço de uma semana. No HTML original esta função era embrulhada sete vezes
 * (base → 1.x → 2.2 → 1.9 → 2.0.1 → 2.0.2 → 2.0.6); aqui as etapas rodam em sequência, na mesma ordem.
 */
import { MARKET_GENRES, SEASON_EVENTS } from './constants';
import { prEvent } from './events';
import { weeklyHype } from './franchise';
import { createFlopReport, addNotice, inspectProductions } from './inbox';
import { processIndustryWeek } from './industry';
import { processWeeklyRelease, releaseProject } from './release';
import { quarterlyUpdate } from './talent';
import type { GameState, SimHooks } from './types';
import { addExpense, addRevenue, pick, pickUniqueThemes } from './utils';
import { tr } from '../i18n';

function runAnnualAwards(s: GameState): void {
  // Um estúdio rival lança um sucesso por ano.
  const r = pick(s.rivals);
  const gross = +(45 + Math.random() * 95).toFixed(1);
  r.hits.push({ title: `${r.name.split(' ')[0]} Chronicles ${s.year}`, studio: r.name, gross });
  s.rep = Math.min(100, s.rep + 2);
}

export function advanceWeek(s: GameState, hooks: SimHooks): void {
  const before = s.projects.map((p) => ({ id: p.id, status: p.status, runWeeks: p.runWeeks }));

  // Streaming: cancelamentos e custo operacional
  if (s.streaming.built) {
    s.subs = Math.max(0, s.subs * (1 - s.streaming.weeklyChurn));
    addExpense(s, s.streaming.weeklyOperations);
  }

  // Progresso das etapas do pipeline
  s.projects
    .filter((p) => p.status === 'production' && p.workflow)
    .forEach((p) => {
      const ph = p.workflow![p.phaseIndex || 0];
      if (!ph) return;
      ph.elapsed = (ph.elapsed || 0) + 1;
      if (ph.elapsed >= ph.weeks) {
        ph.done = true;
        p.phaseIndex = (p.phaseIndex || 0) + 1;
      }
      if (ph.name.toLowerCase().includes('animação') && Math.random() < 0.012) {
        p.overrun = (p.overrun || 0) + p.budget * 0.006;
        p.delayWeeks = (p.delayWeeks || 0) + 1;
        p.weeksLeft++;
      }
    });

  s.week++;

  // Tendências mensais dos mercados (a cada 4 semanas)
  if ((s.week - 1) % 4 === 0) {
    s.markets.forEach((m) => {
      m.genre = pick(MARKET_GENRES);
      m.themes = pickUniqueThemes(10);
      m.theme = m.themes[0];
    });
  }

  // Receita semanal de assinaturas
  if (s.streaming.built) addRevenue(s, (s.subs * s.subPrice) / 4.3);

  // Produções e exibição
  s.projects.forEach((p) => {
    if (p.status === 'production') {
      p.weeksLeft--;
      if (p.weeksLeft <= 0) releaseProject(s, p);
    } else if (p.status === 'released' && (p.runWeeks || 0) > 0) {
      processWeeklyRelease(s, p);
      p.runWeeks = (p.runWeeks || 0) - 1;
    }
  });

  // Evento de imprensa de baixo impacto (18%)
  const inProduction = s.projects.filter((p) => p.status === 'production');
  if (inProduction.length && Math.random() < 0.18) hooks.showEvent(prEvent(pick(inProduction)));

  // Fim do ano de 52 semanas
  if (s.week > 52) {
    s.week = 1;
    s.year++;
    s.yearlyStats.push({ year: s.year, rev: 0, exp: 0 });
    runAnnualAwards(s);
  }

  // Desbloqueios anuais e calendário sazonal
  if (s.week === 1) {
    s.ext.genreUnlocked = Math.min(45, s.ext.genreUnlocked + 2);
    s.ext.filmTypesUnlocked = Math.min(450, s.ext.filmTypesUnlocked + 25);
  }
  const season = SEASON_EVENTS.find((x) => x.week === s.week);
  if (season) {
    s.ext.seasonal.push({ year: s.year, ...season });
    s.ext.seasonal = s.ext.seasonal.slice(-12);
  }

  weeklyHype(s);
  processIndustryWeek(s, hooks);

  // Avisos técnicos e conclusões de produção
  inspectProductions(s);
  s.projects
    .filter((p) => p.status === 'released' && !before.some((b) => b.id === p.id && b.status === 'released'))
    .forEach((p) =>
      addNotice(s, 'high', tr('Produção concluída', 'Production completed'), tr(`${p.title} terminou a produção. Confira qualidade, custos finais e estratégia de lançamento antes de avaliar o resultado.`, `${p.title} has completed production. Review quality, final costs and release strategy before evaluating the result.`), `released_${p.id}_${p.season || 1}`),
    );

  // Mercado de profissionais trimestral
  if (quarterlyUpdate(s)) {
    addNotice(s, 'medium', tr('Mercado de profissionais atualizado', 'Talent market refreshed'), tr('O mercado recebeu novos nomes. Alguns profissionais evoluíram e outros encerraram suas carreiras.', 'New names have entered the market. Some professionals improved while others retired.'), `talent_market_${s.year}_${s.week}`);
  }

  // Relatório técnico quando a janela de exibição termina sem retorno
  s.projects
    .filter((p) => p.status === 'released' && Number(p.runWeeks) === 0)
    .forEach((p) => {
      const old = before.find((x) => x.id === p.id);
      if (old && old.status === 'released' && Number(old.runWeeks) > 0) createFlopReport(s, p);
    });
}
