import { archiveInbox, emptyTrash } from '../game/inbox';
import { useGame } from '../game/store';
import { useLang } from '../i18n';
import { Overlay } from './ui';

const LEVEL_COLOR = { high: 'var(--red)', medium: 'var(--accent)', low: 'var(--blue)' } as const;
const LEVEL_BADGE = { high: 'red', medium: 'gold', low: 'blue' } as const;

export function InboxModal({ onClose }: { onClose: () => void }) {
  const g = useGame();
  const { tr } = useLang();
  const ex = g.state!.ext;

  return (
    <Overlay id="inbox-modal" modalStyle={{ maxWidth: 620 }}>
      <div className="space-between">
        <h2>📥 {tr('Caixa de entrada', 'Inbox')}</h2>
        <button className="sec small" onClick={onClose}>
          {tr('Fechar', 'Close')}
        </button>
      </div>
      <p className="muted" style={{ marginBottom: 10 }}>
        {tr('Eventos aleatórios, alertas de produção e relatórios técnicos de filmes que não recuperaram o investimento aparecem aqui. Os relatórios apontam problemas registrados — não decretam que toda escolha ousada foi um erro.', 'Random events, production alerts and technical reports for films that failed to recover their investment appear here. Reports flag recorded issues — they do not declare every bold creative choice a mistake.')}
      </p>
      <label className="row" style={{ marginBottom: 10 }}>
        <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={ex.inboxPrefs.low} onChange={(e) => g.mutate((s) => void (s.ext.inboxPrefs.low = e.target.checked))} />{' '}
        {tr('Ativar observações de baixa importância', 'Enable low-priority tips')}
      </label>

      {ex.inbox.length ? (
        ex.inbox.map((n) => (
          <div key={n.id} className="phase" style={{ borderLeft: `4px solid ${LEVEL_COLOR[n.level]}` }}>
            <div className="space-between">
              <strong>{n.title}</strong>
              <span className={`badge ${LEVEL_BADGE[n.level]}`}>{n.level === 'high' ? tr('Alta', 'High') : n.level === 'medium' ? tr('Média', 'Medium') : tr('Baixa', 'Low')}</span>
            </div>
            <p style={{ fontSize: '.84rem', marginTop: 5, whiteSpace: 'pre-line' }}>{n.message}</p>
            <p className="muted">
              {tr('Ano', 'Year')} {1959 + n.year} • {tr('Semana', 'Week')} {n.week}
            </p>
          </div>
        ))
      ) : (
        <p className="muted">{tr('Tudo em dia. Quando houver algo útil sobre sua produção, aparecerá aqui.', 'All clear. Useful production updates will appear here.')}</p>
      )}

      <div className="space-between" style={{ marginTop: 12 }}>
        <span className="muted">
          🗑️ {tr('Na lixeira:', 'In trash:')} <strong>{ex.trash.length}</strong>
        </span>
        <div className="row">
          <button className="sec small" onClick={() => g.mutate(archiveInbox)}>
            {tr('Arquivar tudo', 'Archive all')}
          </button>
          <button className="danger small" onClick={() => g.mutate(emptyTrash)}>
            {tr('Esvaziar lixeira', 'Empty trash')}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
