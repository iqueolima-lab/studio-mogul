import { useState } from 'react';
import { getAudioPrefs, toggleSfx } from '../audio/audio';
import { useGame } from '../game/store';
import type { SimMode } from '../game/types';
import { useLang } from '../i18n';
import { LanguageSelect } from './StartMenu';
import { Overlay } from './ui';

export function GameMenu({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const { tr } = useLang();
  const [audio, setAudio] = useState(getAudioPrefs);
  const auto = g.mode === 'auto15';

  const reset = () => {
    if (window.confirm(tr('Deseja reiniciar o estúdio e voltar ao menu inicial?', 'Reset the studio and return to the start menu?'))) {
      onClose();
      g.resetSave();
    }
  };

  return (
    <Overlay id="game-menu">
      <div className="space-between" style={{ marginBottom: 12 }}>
        <h2>⚙️ {tr('Menu do jogo', 'Game menu')}</h2>
        <button className="sec small" onClick={onClose}>
          {tr('Fechar', 'Close')}
        </button>
      </div>

      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>
          {tr('O progresso é salvo automaticamente no armazenamento local do navegador a cada semana e ação.', 'Progress is automatically saved in your browser storage every week and after each action.')}
        </p>
        <div className="row">
          <button className="green" onClick={() => g.save(true)}>
            {tr('Salvar agora', 'Save now')}
          </button>
          <button className="sec" onClick={() => void g.exportSave()}>
            {tr('Copiar código do save', 'Copy save code')}
          </button>
          <button className="danger" onClick={reset}>
            {tr('Reiniciar e voltar ao início', 'Reset and return to start')}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>🌐 Idioma / Language</h3>
        <LanguageSelect style={{ width: '100%' }} />
      </div>

      <div className="card">
        <h3>⏱️ {tr('Ritmo da simulação', 'Simulation pace')}</h3>
        <p className="muted">
          {tr('O padrão é avançar somente quando você tocar em “Pular semana”. Se quiser um desafio de ritmo, ative o avanço automático de 15 segundos por semana.', 'By default, time advances only when you click “Skip week”. For a faster challenge, enable automatic advancement every 15 seconds per week.')}
        </p>
        <label className="muted" htmlFor="simulation-mode">
          {tr('Modo de avanço', 'Advance mode')}
        </label>
        <select id="simulation-mode" value={g.mode} onChange={(e) => g.setMode(e.target.value as SimMode)} style={{ marginTop: 6, width: '100%' }}>
          <option value="manual">{tr('Manual — uma semana por clique (padrão)', 'Manual — one week per click (default)')}</option>
          <option value="auto15">{tr('Desafio — automático, 15 segundos por semana', 'Challenge — automatic, 15 seconds per week')}</option>
        </select>
        <p className="muted" style={{ marginTop: 8 }}>
          {auto
            ? g.state?.difficulty === 'indie'
              ? tr('Modo mais exigente: o calendário avança automaticamente a cada 15 segundos. Eventos e decisões ainda podem interromper o avanço.', 'Toughest mode: the calendar advances automatically every 15 seconds. Events and decisions can still pause it.')
              : tr('Avanço automático a cada 15 segundos. Para a experiência mais exigente, combine com a dificuldade Fudido, Pé-Rapado & Ambicioso.', 'Automatic advance every 15 seconds. For the toughest experience, combine it with the Broke, Scrappy & Ambitious difficulty.')
            : tr('Você controla o calendário. A semana só muda quando tocar em “Pular semana”.', 'You control the calendar. The week only changes when you click “Skip week”.')}
        </p>
      </div>

      <div className="card sound-settings">
        <h3>🎵 {tr('Som do estúdio', 'Studio audio')}</h3>
        <div className="sound-row">
          <span>{tr('Efeitos de clique e passagem de tempo', 'Click and time-advance sound effects')}</span>
          <button className="sec small" onClick={() => setAudio(toggleSfx())}>
            {audio.sfx ? tr('Ligados', 'On') : tr('Desligados', 'Off')}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>{tr('Guia rápido', 'Quick guide')}</h3>
        <ul style={{ paddingLeft: 18, fontSize: '0.8rem', lineHeight: 1.5 }}>
          <li>
            <strong>{tr('Calendário:', 'Calendar:')}</strong>{' '}
            {tr('52 semanas por ano. A campanha começa em 1960. No modo padrão, cada semana avança somente quando você toca em “Pular semana”; o modo Desafio permite avanço automático a cada 15 segundos.', '52 weeks per year. The campaign starts in 1960. In the default mode each week advances only when you click “Skip week”; Challenge mode advances automatically every 15 seconds.')}
          </li>
          <li>
            <strong>{tr('Mercados globais:', 'Global markets:')}</strong>{' '}
            {tr('6 continentes trocam os gêneros e temas em alta a cada 4 semanas (mensalmente).', '6 inhabited continents rotate their trending genres and themes every 4 weeks (monthly).')}
          </li>
          <li>
            <strong>{tr('Cinema e streaming:', 'Theatrical and streaming:')}</strong>{' '}
            {tr('Cinema gera receita por janela. Streaming só pode ser lançado em 2008, exige US$ 750 milhões e custa manter seis regiões; assinantes e receita variam conforme catálogo e retenção.', 'Theatrical releases earn revenue per window. Streaming can only launch in 2008, costs US$ 750 million and six regions to maintain; subscribers and revenue depend on catalogue and retention.')}
          </li>
          <li>
            <strong>{tr('Contratos de exclusividade:', 'Exclusive contracts:')}</strong>{' '}
            {tr('Garanta profissionais por três projetos com 15% de desconto, pagando um adiantamento.', 'Lock in professionals for three projects at a 15% discount by paying a retainer.')}
          </li>
        </ul>
      </div>
    </Overlay>
  );
}
