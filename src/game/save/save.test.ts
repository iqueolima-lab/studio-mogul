import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createNewState } from '../state';
import { SAVE_FORMAT, SCHEMA_VERSION, SaveError, readSaveFile, toSaveFile } from './saveFile';
import { AUTOSAVE_SLOT, BACKUP_EVERY_WEEKS, BACKUP_SLOTS, SaveManager } from './saveManager';
import { IndexedDbStorage } from './storage';

let dbCounter = 0;
const freshManager = () => new SaveManager(new IndexedDbStorage(`studio-mogul-test-${dbCounter++}`));

describe('formato do save', () => {
  it('envolve o estado num envelope versionado com resumo', () => {
    const s = createNewState('Envelope', 'standard');
    const file = toSaveFile(s);
    expect(file.format).toBe(SAVE_FORMAT);
    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.summary).toEqual({ studioName: 'Envelope', year: 1960, week: 1, cash: 20 });
    file.state.cash = 999; // é uma cópia
    expect(s.cash).toBe(20);
  });

  it('aceita estado cru (saves antigos) e recusa saves de versões futuras ou inválidos', () => {
    const s = createNewState('Cru', 'standard');
    expect(readSaveFile(JSON.parse(JSON.stringify(s))).state.studioName).toBe('Cru');
    expect(() => readSaveFile({ ...toSaveFile(s), schemaVersion: SCHEMA_VERSION + 1 })).toThrow(SaveError);
    expect(() => readSaveFile({ foo: 1 })).toThrow(SaveError);
    expect(() => readSaveFile(null)).toThrow(SaveError);
  });
});

describe('SaveManager + IndexedDB', () => {
  it('grava e carrega o autosave', async () => {
    const m = freshManager();
    expect(await m.load()).toBeNull();
    const s = createNewState('Banco', 'indie');
    s.cash = 12.5;
    const summary = await m.write(s);
    expect(summary.cash).toBe(12.5);
    const loaded = await m.load();
    expect(loaded?.state.cash).toBe(12.5);
    expect(loaded?.fromBackup).toBeUndefined();
    expect((await m.summary())?.studioName).toBe('Banco');
  });

  it('mantém as gravações em ordem mesmo sem esperar cada uma', async () => {
    const m = freshManager();
    const s = createNewState('Ordem', 'standard');
    const writes = [1, 2, 3, 4, 5].map((cash) => {
      s.cash = cash;
      return m.write(s);
    });
    await Promise.all(writes);
    expect((await m.load())?.state.cash).toBe(5);
  });

  it('roda os backups a cada trimestre e guarda no máximo três', async () => {
    const m = freshManager();
    const s = createNewState('Backups', 'standard');
    for (let i = 0; i < 5; i++) {
      s.week = 1 + i * BACKUP_EVERY_WEEKS;
      s.year = 1 + Math.floor((s.week - 1) / 52);
      s.week = ((s.week - 1) % 52) + 1;
      s.cash = i;
      await m.write(s);
    }
    const keys = await m.storage.keys();
    expect(keys.sort()).toEqual([AUTOSAVE_SLOT, ...BACKUP_SLOTS].sort());
    const cashIn = async (slot: string) => readSaveFile(await m.storage.get(slot)).state.cash;
    expect(await cashIn(BACKUP_SLOTS[0])).toBe(4);
    expect(await cashIn(BACKUP_SLOTS[1])).toBe(3);
    expect(await cashIn(BACKUP_SLOTS[2])).toBe(2);
  });

  it('usa o backup quando o autosave está corrompido', async () => {
    const m = freshManager();
    const s = createNewState('Resgate', 'standard');
    await m.write(s); // primeiro save também vira backup
    await m.storage.putMany([[AUTOSAVE_SLOT, { lixo: true }]]);
    const loaded = await m.load();
    expect(loaded?.fromBackup).toBe(BACKUP_SLOTS[0]);
    expect(loaded?.state.studioName).toBe('Resgate');
  });

  it('importa o save antigo do localStorage uma única vez e apaga tudo no reset', async () => {
    const m = freshManager();
    const legacy = JSON.stringify(createNewState('Legado', 'tycoon'));
    expect(await m.importLegacy('{quebrado')).toBe(false);
    expect(await m.importLegacy(legacy)).toBe(true);
    expect((await m.load())?.state.studioName).toBe('Legado');
    // Já existe autosave: não sobrescreve
    expect(await m.importLegacy(JSON.stringify(createNewState('Outro', 'standard')))).toBe(true);
    expect((await m.load())?.state.studioName).toBe('Legado');
    await m.clear();
    expect(await m.load()).toBeNull();
  });
});
