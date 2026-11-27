import { useSyncExternalStore } from 'react';

export type Lang = 'pt' | 'en';

const LANG_KEY = 'studio_mogul_language';
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'pt';
  } catch {
    return 'pt';
  }
}

let current: Lang = readStoredLang();
syncDocumentLang();

function syncDocumentLang(): void {
  if (typeof document !== 'undefined') document.documentElement.lang = current === 'en' ? 'en' : 'pt-BR';
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang === 'en' ? 'en' : 'pt';
  try {
    localStorage.setItem(LANG_KEY, current);
  } catch {
    /* armazenamento indisponível */
  }
  syncDocumentLang();
  listeners.forEach((fn) => fn());
}

/** Escolhe o texto do idioma atual. Usado tanto pela UI quanto pela lógica do jogo (logs, avisos). */
export function tr(pt: string, en: string): string {
  return current === 'en' ? en : pt;
}

/** Escolhe a entrada de um par [pt, en]. */
export function trPair(pair: readonly [string, string]): string {
  return current === 'en' ? pair[1] : pair[0];
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Hook que re-renderiza o componente quando o idioma muda. */
export function useLang() {
  const lang = useSyncExternalStore(subscribe, getLang);
  return { lang, tr, trPair, setLang };
}

/** Formata milhões de dólares conforme o idioma. */
export function money(value: number, digits = 2): string {
  const v = Number.isFinite(value) ? value : 0;
  return tr(`US$ ${v.toFixed(digits)} mi`, `US$ ${v.toFixed(digits)}M`);
}
