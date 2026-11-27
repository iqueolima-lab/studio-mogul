/* Ações de gestão: mercados e plataforma de streaming */
import { MARKET_NAMES, STREAMING_CHURN, STREAMING_COST, STREAMING_OPS, STREAMING_YEAR } from './constants';
import type { ActionResult, GameState, Market } from './types';
import { addExpense, historicalYear } from './utils';
import { money, tr, trPair } from '../i18n';

export const marketName = (m: Market): string => (MARKET_NAMES[m.id] ? trPair(MARKET_NAMES[m.id]) : m.name);

export function unlockMarket(s: GameState, id: string): ActionResult {
  const m = s.markets.find((x) => x.id === id);
  if (!m || m.unlocked) return { ok: false };
  if (s.cash < m.locCost) return { ok: false, message: tr(`É necessário ter ${money(m.locCost)} para localização e dublagem em ${marketName(m)}.`, `You need ${money(m.locCost)} for ${marketName(m)} localisation and dubbing.`) };
  addExpense(s, m.locCost);
  m.unlocked = true;
  return { ok: true };
}

export const streamingWeeklyGross = (s: GameState): number => (s.streaming.built ? (s.subs * s.subPrice) / 4.3 : 0);
export const streamingWeeklyNet = (s: GameState): number => (s.streaming.built ? streamingWeeklyGross(s) - s.streaming.weeklyOperations : 0);

export function buildStreamingPlatform(s: GameState): ActionResult {
  if (historicalYear(s) < STREAMING_YEAR)
    return { ok: false, message: tr('Streaming comercial ainda não está disponível nesta etapa histórica. A primeira janela de lançamento abre em 2008.', 'Commercial streaming is not available yet in this historical period. The first launch window opens in 2008.') };
  if (s.streaming.built) return { ok: false, message: tr('A plataforma já está em operação.', 'The platform is already running.') };
  if (s.cash < STREAMING_COST)
    return { ok: false, message: tr(`Capital insuficiente. A implantação global exige US$ ${STREAMING_COST} milhões; seu caixa atual é ${money(s.cash)}.`, `Insufficient capital. A global launch requires US$ ${STREAMING_COST} million; your current cash is ${money(s.cash)}.`) };
  addExpense(s, STREAMING_COST);
  s.streaming = { built: true, launchYear: historicalYear(s), regions: 6, weeklyOperations: STREAMING_OPS, weeklyChurn: STREAMING_CHURN };
  s.subs = 0.05;
  return { ok: true, message: tr('Plataforma lançada! As seis regiões estão conectadas. Agora será necessário conquistar assinantes e cobrir US$ 2,4 milhões semanais de operação.', 'Platform launched! All six regions are connected. Now you need to win subscribers and cover US$ 2.4 million in weekly operating costs.') };
}

export function adjustSubPrice(s: GameState, delta: number): ActionResult {
  if (!s.streaming.built) return { ok: false, message: tr('Ajustar preço só é possível depois do lançamento da plataforma.', 'You can only adjust the price after the platform launches.') };
  s.subPrice = Math.max(4.99, Math.min(19.99, +(s.subPrice + delta).toFixed(2)));
  s.subs = delta > 0 ? Math.max(0, +(s.subs * 0.94).toFixed(2)) : +(s.subs * 1.04).toFixed(2);
  return { ok: true };
}
