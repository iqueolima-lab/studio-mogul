/**
 * Camada de armazenamento dos saves. A interface isola o jogo do mecanismo concreto:
 * hoje IndexedDB no navegador; amanhã um arquivo (desktop) ou um backend (nuvem).
 */

export interface SaveStorage {
  /** true quando os dados sobrevivem a um recarregamento da página. */
  readonly persistent: boolean;
  get(slot: string): Promise<unknown | undefined>;
  /** Grava vários slots numa única transação: ou todos são gravados, ou nenhum. */
  putMany(entries: [slot: string, value: unknown][]): Promise<void>;
  delete(slots: string[]): Promise<void>;
  keys(): Promise<string[]>;
}

const DB_NAME = 'studio-mogul';
const DB_VERSION = 1;
const STORE = 'saves';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export class IndexedDbStorage implements SaveStorage {
  readonly persistent = true;
  private db: Promise<IDBDatabase> | null = null;

  constructor(private readonly dbName = DB_NAME) {}

  private open(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(this.dbName, DB_VERSION);
        // Versões futuras do banco ganham novos passos aqui (novos object stores, índices…).
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
        };
        req.onsuccess = () => {
          const db = req.result;
          // Outra aba abriu uma versão mais nova do banco: libera a conexão.
          db.onversionchange = () => db.close();
          resolve(db);
        };
        req.onerror = () => reject(req.error);
      });
      this.db.catch(() => (this.db = null));
    }
    return this.db;
  }

  async get(slot: string): Promise<unknown | undefined> {
    const db = await this.open();
    return request(db.transaction(STORE, 'readonly').objectStore(STORE).get(slot));
  }

  async putMany(entries: [string, unknown][]): Promise<void> {
    if (!entries.length) return;
    const db = await this.open();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    entries.forEach(([slot, value]) => store.put(value, slot));
    await transactionDone(tx);
  }

  async delete(slots: string[]): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE, 'readwrite');
    slots.forEach((slot) => tx.objectStore(STORE).delete(slot));
    await transactionDone(tx);
  }

  async keys(): Promise<string[]> {
    const db = await this.open();
    const keys = await request(db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys());
    return keys.map(String);
  }
}

/** Alternativa em memória: usada quando o IndexedDB não existe ou está bloqueado (ex.: navegação privada). */
export class MemoryStorage implements SaveStorage {
  readonly persistent = false;
  private data = new Map<string, unknown>();

  async get(slot: string) {
    const v = this.data.get(slot);
    return v === undefined ? undefined : structuredClone(v);
  }
  async putMany(entries: [string, unknown][]) {
    entries.forEach(([slot, value]) => this.data.set(slot, structuredClone(value)));
  }
  async delete(slots: string[]) {
    slots.forEach((slot) => this.data.delete(slot));
  }
  async keys() {
    return [...this.data.keys()];
  }
}

/** Abre o IndexedDB e confirma que funciona; senão cai para a memória. */
export async function openStorage(): Promise<SaveStorage> {
  if (typeof indexedDB !== 'undefined') {
    try {
      const idb = new IndexedDbStorage();
      await idb.keys();
      // Pede ao navegador para não apagar os dados quando faltar espaço (best effort).
      void navigator.storage?.persist?.().catch(() => undefined);
      return idb;
    } catch {
      /* IndexedDB indisponível */
    }
  }
  return new MemoryStorage();
}
