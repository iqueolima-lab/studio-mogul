import { describe, expect, it } from 'vitest';
import { computeTotal, confirmGreenlight, defaultForm } from './greenlight';
import { advanceWeek } from './simulation';
import { createNewState, normalizeState } from './state';
import type { GameEvent, GameState, SimHooks } from './types';

/** Ganchos de teste: aceita todo evento e escolhe sempre a primeira opção. */
function autoHooks(s: () => GameState): SimHooks & { events: number } {
  const hooks = {
    events: 0,
    showEvent(ev: GameEvent) {
      hooks.events++;
      ev.choices[0].apply(s());
      return true;
    },
    isEventOpen: () => false,
  };
  return hooks;
}

describe('simulação', () => {
  it('cria um estúdio novo com equipe inicial e mercado de contratação', () => {
    const s = createNewState('Teste', 'standard');
    expect(s.cash).toBe(20);
    expect(s.talent.filter((t) => t.role === 'Director')).toHaveLength(2);
    expect(s.ext.proTalent.pool.length).toBeGreaterThan(0);
    expect(s.markets.filter((m) => m.unlocked)).toHaveLength(1);
  });

  it('cobra exatamente o custo exibido ao aprovar um projeto', () => {
    const s = createNewState('Teste', 'standard');
    const form = { ...defaultForm(s), budget: 2.5, mkt: 0.5, title: 'Piloto' };
    const total = computeTotal(s, form);
    const result = confirmGreenlight(s, form);
    expect(result.ok).toBe(true);
    expect(s.cash).toBeCloseTo(20 - total, 6);
    expect(s.projects[0].workflow!.reduce((a, p) => a + p.weeks, 0)).toBe(s.projects[0].weeksLeft);
  });

  it('recusa projeto sem caixa suficiente', () => {
    const s = createNewState('Teste', 'standard');
    s.cash = 1;
    const result = confirmGreenlight(s, defaultForm(s));
    expect(result.ok).toBe(false);
    expect(s.projects).toHaveLength(0);
  });

  it.each(['standard', 'indie', 'tycoon'] as const)('roda 15 anos sem erros (%s)', (difficulty) => {
    const s = createNewState('Teste', difficulty);
    s.cash = 5000; // garante produções contínuas para exercitar todos os sistemas
    const hooks = autoHooks(() => s);
    for (let week = 0; week < 52 * 15; week++) {
      if (s.projects.filter((p) => p.status === 'production').length < 2) {
        const form = { ...defaultForm(s), title: `Filme ${week}`, format: week % 3 === 0 ? ('series' as const) : ('movie' as const) };
        if (form.format === 'series') form.length = 'ep_standard';
        confirmGreenlight(s, form);
      }
      advanceWeek(s, hooks);
      expect(Number.isFinite(s.cash)).toBe(true);
    }
    expect(s.year).toBe(16);
    expect(s.projects.some((p) => p.status === 'released')).toBe(true);
    expect(Object.keys(s.ext.franchiseHype).length).toBeGreaterThan(0);
    expect(s.ext.genreUnlocked).toBe(8 + 2 * 15);
    expect(s.ext.inbox.length).toBeLessThanOrEqual(20);
    // O save precisa sobreviver a um ciclo de serialização.
    const reloaded = normalizeState(JSON.parse(JSON.stringify(s)));
    expect(reloaded.projects.length).toBe(s.projects.length);
  });

  it('migra saves antigos do HTML (nomes de campos e gêneros em inglês)', () => {
    const legacy = {
      studioName: 'Velho',
      difficulty: 'standard',
      cash: 12,
      year: 3,
      week: 10,
      rep: 30,
      subs: 4,
      subPrice: 9.99,
      markets: [{ id: 'na', name: 'North America', size: 1.35, locCost: 0, unlocked: true, genre: 'Action', theme: 'Heist' }],
      talent: [{ id: 'd1', name: 'Elena Vance', role: 'Director', star: 85, fee: 1.6 }],
      rivals: [],
      projects: [{ id: 1, title: 'X', format: 'movie', status: 'released', totalBruto: 10, 'studioLíquido': 3, quality: 70, buzz: 10, budget: 6, mkt: 1.5 }],
      franchises: {},
      yearlyStats: [{ year: 3, rev: 0, exp: 0 }],
    };
    const s = normalizeState(legacy);
    expect(s.markets[0].genre).toBe('Ação');
    expect(s.markets[0].themes).toHaveLength(10);
    expect(s.projects[0].totalGross).toBe(10);
    expect(s.projects[0].studioNet).toBe(3);
    expect(s.subs).toBe(0); // streaming não construído
    expect(s.talent.every((t) => t.generated)).toBe(true);
  });
});
