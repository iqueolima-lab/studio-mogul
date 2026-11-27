/**
 * Estado central do jogo. A simulação altera o objeto de estado diretamente (como no jogo original);
 * cada alteração passa por `mutate`, que salva no localStorage e avisa a interface para re-renderizar.
 */
import { useSyncExternalStore } from 'react';
import { MODE_KEY, SAVE_KEY } from './constants';
import { advanceWeek } from './simulation';
import { createNewState, normalizeState } from './state';
import type { ActionResult, Difficulty, GameEvent, GameState, SimHooks, SimMode } from './types';
import { clamp, historicalYear } from './utils';
import { playTimeSound } from '../audio/audio';
import { tr } from '../i18n';

export type ToastKind = 'info' | 'success' | 'error';
export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface SaveSummary {
  studioName: string;
  year: number;
  week: number;
  cash: number;
}

/** Duração de uma semana no modo Desafio, em milissegundos. */
const AUTO_WEEK_MS = 15000;
const TICK_MS = 500;

type Listener = () => void;

class Store {
  state: GameState | null = null;
  pendingEvent: GameEvent | null = null;
  greenlightOpen = false;
  mode: SimMode = localStorage.getItem(MODE_KEY) === 'auto15' ? 'auto15' : 'manual';
  toasts: Toast[] = [];

  private version = 0;
  private listeners = new Set<Listener>();

  // Barra de progresso do modo automático: assinatura separada para não re-renderizar o jogo inteiro.
  private progressValue = 0;
  private progressListeners = new Set<Listener>();
  private timer: number | null = null;

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getVersion = () => this.version;
  private emit() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  subscribeProgress = (fn: Listener) => {
    this.progressListeners.add(fn);
    return () => this.progressListeners.delete(fn);
  };
  getProgress = () => this.progressValue;
  private setProgress(v: number) {
    if (v === this.progressValue) return;
    this.progressValue = v;
    this.progressListeners.forEach((fn) => fn());
  }

  private hooks: SimHooks = {
    showEvent: (event) => {
      if (this.pendingEvent) return false;
      this.pendingEvent = event;
      return true;
    },
    isEventOpen: () => !!this.pendingEvent,
  };

  /** Aplica uma alteração ao estado, salva e re-renderiza. */
  mutate(fn: (s: GameState) => void, save = true): void {
    if (!this.state) return;
    fn(this.state);
    this.state.rep = clamp(this.state.rep, 5, 100);
    if (save) this.save();
    this.emit();
  }

  /** Executa uma ação que pode falhar; mostra a mensagem como aviso. */
  act(fn: (s: GameState) => ActionResult, successToast = false): boolean {
    if (!this.state) return false;
    let result: ActionResult = { ok: false };
    this.mutate((s) => {
      result = fn(s);
    }, true);
    if (result.message && (!result.ok || successToast)) this.toast(result.message, result.ok ? 'success' : 'error');
    return result.ok;
  }

  // ---- Persistência ----
  save(notify = false): void {
    if (!this.state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      if (notify) this.toast(tr('Progresso salvo localmente!', 'Progress saved locally!'), 'success');
    } catch {
      this.toast(tr('Não foi possível salvar no navegador.', 'Could not save to browser storage.'), 'error');
    }
  }

  readSaveSummary(): SaveSummary | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      return { studioName: String(p.studioName ?? ''), year: historicalYear(p), week: Number(p.week) || 1, cash: Number(p.cash) || 0 };
    } catch {
      return null;
    }
  }

  newGame(name: string, difficulty: Difficulty): void {
    this.state = createNewState(name.trim() || 'Apex Pictures', difficulty);
    this.pendingEvent = null;
    this.setMode('manual');
    this.save();
    this.startLoop();
    this.emit();
  }

  loadGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      this.state = normalizeState(JSON.parse(raw));
    } catch {
      this.toast(tr('O save salvo está corrompido.', 'The saved game is corrupted.'), 'error');
      return false;
    }
    this.pendingEvent = null;
    this.setMode(this.mode);
    this.save();
    this.startLoop();
    this.emit();
    return true;
  }

  async exportSave(): Promise<void> {
    if (!this.state) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.state));
      this.toast(tr('Código JSON copiado!', 'JSON save code copied!'), 'success');
    } catch {
      this.toast(tr('Não foi possível copiar para a área de transferência.', 'Could not copy to the clipboard.'), 'error');
    }
  }

  resetSave(): void {
    localStorage.removeItem(SAVE_KEY);
    this.stopLoop();
    this.state = null;
    this.pendingEvent = null;
    this.greenlightOpen = false;
    this.setProgress(0);
    this.emit();
  }

  // ---- Tempo ----
  advanceWeek(): void {
    if (!this.state) return;
    playTimeSound();
    this.setProgress(0);
    this.mutate((s) => advanceWeek(s, this.hooks));
  }

  setMode(mode: SimMode): void {
    this.mode = mode === 'auto15' ? 'auto15' : 'manual';
    localStorage.setItem(MODE_KEY, this.mode);
    this.setProgress(0);
    this.emit();
  }

  /** O relógio pausa em segundo plano e com eventos ou o formulário de aprovação abertos. */
  private startLoop(): void {
    this.stopLoop();
    this.timer = window.setInterval(() => {
      if (document.hidden || !this.state || this.mode !== 'auto15') return;
      if (this.pendingEvent || this.greenlightOpen) return;
      const next = this.progressValue + (TICK_MS / AUTO_WEEK_MS) * 100;
      if (next >= 100) this.advanceWeek();
      else this.setProgress(next);
    }, TICK_MS);
  }

  private stopLoop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  /** Não acumula tempo de simulação enquanto o app está em segundo plano. */
  handleVisibilityChange(): void {
    if (document.hidden) this.setProgress(0);
  }

  // ---- Interface ----
  setGreenlightOpen(open: boolean): void {
    this.greenlightOpen = open;
    this.emit();
  }

  resolveEvent(choiceIndex: number): void {
    const ev = this.pendingEvent;
    if (!ev) return;
    this.pendingEvent = null;
    this.mutate((s) => ev.choices[choiceIndex]?.apply(s));
  }

  toast(message: string, kind: ToastKind = 'info'): void {
    const id = Date.now() + Math.random();
    this.toasts = [...this.toasts, { id, message, kind }].slice(-4);
    this.emit();
    window.setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.emit();
    }, 4200);
  }

  /** Re-renderiza sem salvar (ex.: troca de idioma). */
  refresh(): void {
    this.emit();
  }
}

export const store = new Store();

/** Hook principal: re-renderiza o componente a cada alteração do jogo. */
export function useGame(): Store {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store;
}

/** Estado do jogo garantidamente carregado (usar somente dentro das telas do jogo). */
export function useGameState(): GameState {
  const g = useGame();
  if (!g.state) throw new Error('Game state not loaded');
  return g.state;
}

export function useWeekProgress(): number {
  return useSyncExternalStore(store.subscribeProgress, store.getProgress);
}
