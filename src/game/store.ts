/**
 * Estado central do jogo. A simulação altera o objeto de estado diretamente (como no jogo original);
 * cada alteração passa por `mutate`, que agenda um autosave no IndexedDB e avisa a interface.
 */
import { useSyncExternalStore } from 'react';
import { MODE_KEY, SAVE_KEY } from './constants';
import { SaveError, toSaveFile, type SaveSummary } from './save/saveFile';
import { SaveManager } from './save/saveManager';
import { MemoryStorage, openStorage } from './save/storage';
import { advanceWeek } from './simulation';
import { createNewState } from './state';
import type { ActionResult, Difficulty, GameEvent, GameState, SimHooks, SimMode } from './types';
import { clamp } from './utils';
import { playTimeSound } from '../audio/audio';
import { tr } from '../i18n';

export type ToastKind = 'info' | 'success' | 'error';
export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

export type { SaveSummary };

/** Duração de uma semana no modo Desafio, em milissegundos. */
const AUTO_WEEK_MS = 15000;
const TICK_MS = 500;
/** Agrupa várias alterações seguidas num único autosave. */
const SAVE_DELAY_MS = 800;

type Listener = () => void;

class Store {
  state: GameState | null = null;
  pendingEvent: GameEvent | null = null;
  greenlightOpen = false;
  mode: SimMode = localStorage.getItem(MODE_KEY) === 'auto15' ? 'auto15' : 'manual';
  toasts: Toast[] = [];
  /** true depois que o armazenamento foi aberto e o resumo do save foi lido. */
  ready = false;
  saveSummary: SaveSummary | null = null;

  private saves = new SaveManager(new MemoryStorage());
  private saveTimer: number | null = null;
  private saveErrorShown = false;
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

  /** Abre o banco, migra o save antigo do localStorage e lê o resumo para o menu inicial. */
  async init(): Promise<void> {
    if (this.ready) return;
    const storage = await openStorage();
    this.saves = new SaveManager(storage);
    if (!storage.persistent)
      this.toast(tr('O navegador bloqueou o armazenamento local: o progresso não será mantido ao fechar a página.', 'The browser blocked local storage: progress will not be kept after closing the page.'), 'error');
    try {
      const legacy = localStorage.getItem(SAVE_KEY);
      // Só apaga a chave antiga quando o save já está no banco persistente.
      if (legacy && (await this.saves.importLegacy(legacy)) && storage.persistent) localStorage.removeItem(SAVE_KEY);
    } catch {
      /* mantém a chave antiga para tentar de novo na próxima abertura */
    }
    this.saveSummary = await this.saves.summary().catch(() => null);
    this.ready = true;
    this.emit();
  }

  /** Agenda um autosave; várias alterações seguidas viram uma só gravação. */
  save(notify = false): void {
    if (!this.state) return;
    if (notify) {
      void this.flush().then((ok) => ok && this.toast(tr('Progresso salvo!', 'Progress saved!'), 'success'));
      return;
    }
    if (this.saveTimer === null) this.saveTimer = window.setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  /** Grava imediatamente (usado ao sair da página, no "Salvar agora" e ao criar um jogo). */
  async flush(): Promise<boolean> {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (!this.state) return true;
    try {
      this.saveSummary = await this.saves.write(this.state);
      this.saveErrorShown = false;
      return true;
    } catch {
      if (!this.saveErrorShown) this.toast(tr('Não foi possível salvar no navegador.', 'Could not save to browser storage.'), 'error');
      this.saveErrorShown = true;
      return false;
    }
  }

  newGame(name: string, difficulty: Difficulty): void {
    this.state = createNewState(name.trim() || 'Apex Pictures', difficulty);
    this.pendingEvent = null;
    this.saves.resetBackupClock();
    this.setMode('manual');
    void this.flush();
    this.startLoop();
    this.emit();
  }

  async loadGame(): Promise<boolean> {
    try {
      const loaded = await this.saves.load();
      if (!loaded) return false;
      this.state = loaded.state;
      if (loaded.fromBackup)
        this.toast(tr('O save mais recente estava danificado; o último backup foi carregado.', 'The latest save was damaged; the most recent backup was loaded.'), 'error');
    } catch (err) {
      const newer = err instanceof SaveError && err.reason === 'newer';
      this.toast(newer ? tr('Este save é de uma versão mais nova do jogo.', 'This save comes from a newer version of the game.') : tr('O save salvo está corrompido.', 'The saved game is corrupted.'), 'error');
      return false;
    }
    this.pendingEvent = null;
    this.setMode(this.mode);
    this.save();
    this.startLoop();
    this.emit();
    return true;
  }

  /** Copia o save completo (envelope versionado) como JSON. */
  async exportSave(): Promise<void> {
    if (!this.state) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(toSaveFile(this.state)));
      this.toast(tr('Código JSON copiado!', 'JSON save code copied!'), 'success');
    } catch {
      this.toast(tr('Não foi possível copiar para a área de transferência.', 'Could not copy to the clipboard.'), 'error');
    }
  }

  async resetSave(): Promise<void> {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.stopLoop();
    this.state = null;
    this.pendingEvent = null;
    this.greenlightOpen = false;
    this.setProgress(0);
    try {
      await this.saves.clear();
      localStorage.removeItem(SAVE_KEY);
    } catch {
      this.toast(tr('Não foi possível apagar o save.', 'Could not delete the save.'), 'error');
    }
    this.saveSummary = null;
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
    if (!document.hidden) return;
    this.setProgress(0);
    // A aba pode ser fechada a partir daqui: grava o que estiver pendente.
    if (this.saveTimer !== null) void this.flush();
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
