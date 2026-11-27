import { useGameState, store, useWeekProgress } from '../game/store';
import { historicalYear, monthLabel } from '../game/utils';
import { money, useLang } from '../i18n';

interface HudProps {
  onOpenMenu: () => void;
  onOpenInbox: () => void;
}

export function Hud({ onOpenMenu, onOpenInbox }: HudProps) {
  const s = useGameState();
  const { tr } = useLang();
  const progress = useWeekProgress();
  const inbox = s.ext.inbox;
  const badge = inbox.some((n) => n.level === 'high') ? 'red' : inbox.some((n) => n.level === 'medium') ? 'gold' : '';

  return (
    <div id="hud">
      <div className="space-between">
        <div className="hud-stats">
          <strong>{s.studioName}</strong>
          <div className="stat-box">
            {tr('Caixa', 'Cash')}: <span className="stat-val">{money(s.cash)}</span>
          </div>
          <div className="stat-box">
            {historicalYear(s)} • {tr('S', 'W')}
            {s.week}/52 ({monthLabel(s.week)})
          </div>
          <div className="stat-box">
            {tr('Reputação', 'Reputation')}: <span className="stat-val">{s.rep}</span>/100
          </div>
          <div className="stat-box">
            {tr('Assinantes', 'Subscribers')}: <span className="stat-val">{s.subs.toFixed(2)}M</span>
          </div>
        </div>
        <div className="row" style={{ gap: 5 }}>
          <button className="sec small" onClick={onOpenInbox}>
            📥 {tr('Caixa de entrada', 'Inbox')} <span className={`badge ${badge}`}>{inbox.length}</span>
          </button>
          <span className="badge gold">{store.mode === 'auto15' ? tr('Desafio • 15s/semana', 'Challenge • 15s/week') : tr('Avanço manual', 'Manual advance')}</span>
          <button className="small" onClick={() => store.advanceWeek()}>
            {tr('Pular semana ⏭', 'Skip week ⏭')}
          </button>
          <button className="sec small" onClick={onOpenMenu} aria-label={tr('Menu do jogo', 'Game menu')}>
            ☰
          </button>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
