/**
 * Gerencia os slots de save: autosave + backups rotativos, gravações em ordem e
 * migração do save antigo do localStorage.
 */
import type { GameState } from '../types';
import { tickNow } from '../utils';
import { SaveError, isSaveFile, readSaveFile, toSaveFile, type SaveSummary } from './saveFile';
import type { SaveStorage } from './storage';

export const AUTOSAVE_SLOT = 'autosave';
export const BACKUP_SLOTS = ['backup-1', 'backup-2', 'backup-3'];
/** Um novo ponto de backup a cada trimestre do jogo (13 semanas). */
export const BACKUP_EVERY_WEEKS = 13;

export interface LoadedSave {
  state: GameState;
  savedAt?: string;
  /** Preenchido quando o autosave estava ilegível e um backup foi usado. */
  fromBackup?: string;
}

export class SaveManager {
  private chain: Promise<unknown> = Promise.resolve();
  private lastBackupTick = Number.NEGATIVE_INFINITY;

  constructor(readonly storage: SaveStorage) {}

  get persistent(): boolean {
    return this.storage.persistent;
  }

  /** Enfileira a operação: gravações nunca se sobrepõem nem chegam fora de ordem. */
  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const next = this.chain.then(op, op);
    this.chain = next.catch(() => undefined);
    return next;
  }

  /**
   * Grava o estado no autosave. A cada BACKUP_EVERY_WEEKS semanas de jogo, o mesmo save também entra
   * no backup mais recente e os anteriores descem uma posição. Tudo numa única transação.
   */
  write(state: GameState): Promise<SaveSummary> {
    const file = toSaveFile(state); // cópia feita agora, antes de o jogo continuar
    const tick = tickNow(state);
    return this.enqueue(async () => {
      const entries: [string, unknown][] = [[AUTOSAVE_SLOT, file]];
      const backup = tick - this.lastBackupTick >= BACKUP_EVERY_WEEKS || tick < this.lastBackupTick;
      if (backup) {
        const older = await Promise.all(BACKUP_SLOTS.slice(0, -1).map((slot) => this.storage.get(slot)));
        entries.push([BACKUP_SLOTS[0], file]);
        older.forEach((value, i) => value !== undefined && entries.push([BACKUP_SLOTS[i + 1], value]));
      }
      await this.storage.putMany(entries);
      if (backup) this.lastBackupTick = tick;
      return file.summary;
    });
  }

  /** Carrega o autosave; se estiver corrompido, tenta os backups do mais novo ao mais antigo. */
  load(): Promise<LoadedSave | null> {
    return this.enqueue(async () => {
      let lastError: unknown = null;
      for (const slot of [AUTOSAVE_SLOT, ...BACKUP_SLOTS]) {
        const raw = await this.storage.get(slot);
        if (raw === undefined) continue;
        try {
          const { state, savedAt } = readSaveFile(raw);
          this.lastBackupTick = tickNow(state);
          return { state, savedAt, fromBackup: slot === AUTOSAVE_SLOT ? undefined : slot };
        } catch (err) {
          lastError = err;
        }
      }
      if (lastError) throw lastError;
      return null;
    });
  }

  /** Resumo do save mais recente legível, para o menu inicial (sem migrar o estado inteiro). */
  summary(): Promise<SaveSummary | null> {
    return this.enqueue(async () => {
      for (const slot of [AUTOSAVE_SLOT, ...BACKUP_SLOTS]) {
        const raw = await this.storage.get(slot);
        if (isSaveFile(raw) && raw.summary) return raw.summary;
      }
      return null;
    });
  }

  /** Apaga todos os slots (reiniciar o jogo). */
  clear(): Promise<void> {
    return this.enqueue(async () => {
      await this.storage.delete([AUTOSAVE_SLOT, ...BACKUP_SLOTS]);
      this.lastBackupTick = Number.NEGATIVE_INFINITY;
    });
  }

  /** Começa um jogo novo: o primeiro save dele já vira um ponto de backup. */
  resetBackupClock(): void {
    this.lastBackupTick = Number.NEGATIVE_INFINITY;
  }

  /**
   * Copia o save antigo do localStorage para o banco, se ainda não houver autosave.
   * Retorna true quando a chave antiga pode ser apagada com segurança.
   */
  importLegacy(rawJson: string): Promise<boolean> {
    return this.enqueue(async () => {
      if ((await this.storage.get(AUTOSAVE_SLOT)) !== undefined) return true;
      let state: GameState;
      try {
        state = readSaveFile(JSON.parse(rawJson)).state;
      } catch (err) {
        if (err instanceof SaveError || err instanceof SyntaxError) return false;
        throw err;
      }
      const file = toSaveFile(state);
      await this.storage.putMany([
        [AUTOSAVE_SLOT, file],
        [BACKUP_SLOTS[0], file],
      ]);
      return true;
    });
  }
}
