import { useState, type CSSProperties } from 'react';
import { DIFFICULTY_OPTIONS } from '../game/constants';
import { DIFFICULTY_COPY } from '../game/content';
import { store } from '../game/store';
import type { Difficulty } from '../game/types';
import { money, useLang, type Lang } from '../i18n';

export function LanguageSelect({ style }: { style?: CSSProperties }) {
  const { lang, setLang } = useLang();
  return (
    <select aria-label="Language / Idioma" value={lang} onChange={(e) => setLang(e.target.value as Lang)} style={style}>
      <option value="pt">Português (Brasil)</option>
      <option value="en">English</option>
    </select>
  );
}

export function StartMenu({ onStarted }: { onStarted: () => void }) {
  const { tr, trPair } = useLang();
  const [name, setName] = useState('Apex Pictures');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const saved = store.readSaveSummary();
  const copy = DIFFICULTY_COPY[difficulty];
  const [title, ...rest] = trPair(copy.summary).split(':');

  return (
    <div id="start-menu" className="overlay">
      <div className="modal">
        <div className="start-hero">
          <div className="start-kicker">{tr('SIMULADOR DE ESTÚDIO • DESDE 1960', 'STUDIO SIMULATOR • SINCE 1960')}</div>
          <h1>
            🎬 {tr('Estúdio Mogul', 'Studio Mogul')} <span>✦</span>
            <small className="start-version">{tr('Versão 2.2 • Indústria viva', 'Version 2.2 • Living industry')}</small>
          </h1>
          <p>{tr('Da primeira ideia ao sucesso de bilheteria: construa um estúdio, descubra seu estilo e conte histórias que atravessam gerações.', 'From the first idea to box-office success: build a studio, find your style and tell stories across generations.')}</p>
          <div className="start-pills">
            <span>🎞️ {tr('Cinema', 'Film')}</span>
            <span>📺 {tr('Séries', 'Series')}</span>
            <span>✨ {tr('Animação', 'Animation')}</span>
          </div>
        </div>

        {saved && (
          <div className="card" style={{ borderColor: 'var(--green)' }}>
            <div className="space-between">
              <div>
                <strong style={{ color: 'var(--green)' }}>{tr('Estúdio salvo encontrado', 'Saved studio found')}</strong>
                <div className="muted">
                  {saved.studioName} • {saved.year}, {tr('Semana', 'Week')} {saved.week} • {money(saved.cash)}
                </div>
              </div>
              <button className="green" onClick={() => store.loadGame() && onStarted()}>
                {tr('Continuar estúdio', 'Continue studio')}
              </button>
            </div>
          </div>
        )}

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <strong>🌐 Idioma / Language</strong>
          <LanguageSelect style={{ maxWidth: 190 }} />
        </div>

        <div className="card">
          <h3>{tr('Configuração de novo estúdio', 'New studio setup')}</h3>
          <label className="muted" htmlFor="setup-name">
            {tr('Nome do estúdio', 'Studio name')}
          </label>
          <input id="setup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ margin: '4px 0 10px' }} />

          <label className="muted" htmlFor="setup-diff">
            {tr('Dificuldade', 'Difficulty')}
          </label>
          <select id="setup-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} style={{ margin: '4px 0 10px' }}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {trPair(d.label)}
              </option>
            ))}
          </select>
          <div className="tooltip-box">
            <strong>{title}:</strong>
            {rest.join(':')}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', lineHeight: 1.45 }}>{trPair(copy.details)}</div>
          </div>
          <button
            style={{ width: '100%', padding: 12, fontSize: '1rem' }}
            onClick={() => {
              store.newGame(name, difficulty);
              onStarted();
            }}
          >
            {tr('Fundar estúdio', 'Found studio')}
          </button>
        </div>
      </div>
    </div>
  );
}
