/* Efeitos sonoros procedurais leves: não dependem de arquivos nem de conexão externa. */
import { AUDIO_KEY } from '../game/constants';

export interface AudioPrefs {
  sfx: boolean;
}

let ctx: AudioContext | null = null;
let prefs: AudioPrefs = { sfx: true };

try {
  const stored = JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}');
  if (typeof stored.sfx === 'boolean') prefs = { sfx: stored.sfx };
} catch {
  /* preferências inválidas: usa o padrão */
}

export const getAudioPrefs = (): AudioPrefs => ({ ...prefs });

function ensureAudio(): AudioContext | null {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine', delay = 0): void {
  if (!prefs.sfx) return;
  const c = ensureAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t = c.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

export const playClickSound = () => tone(640, 0.075, 0.025, 'sine');
export function playTimeSound(): void {
  tone(523.25, 0.18, 0.035, 'sine');
  tone(659.25, 0.22, 0.022, 'sine', 0.07);
}

export function toggleSfx(): AudioPrefs {
  prefs = { sfx: !prefs.sfx };
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(prefs));
  } catch {
    /* armazenamento indisponível */
  }
  return getAudioPrefs();
}
