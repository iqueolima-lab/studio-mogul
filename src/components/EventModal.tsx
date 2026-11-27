import { useGame } from '../game/store';
import { useLang } from '../i18n';
import { Overlay } from './ui';

export function EventModal() {
  const g = useGame();
  const { tr } = useLang();
  const ev = g.pendingEvent;
  if (!ev) return null;
  return (
    <Overlay id="event-modal" modalStyle={{ borderColor: 'var(--accent)' }}>
      <span className="badge gold">{tr('CENTRAL DE PRODUÇÃO E IMPRENSA', 'PRODUCTION & PRESS DESK')}</span>
      <h2 style={{ marginTop: 6 }}>{ev.title}</h2>
      <p style={{ fontSize: '0.88rem', margin: '10px 0', lineHeight: 1.45 }}>{ev.desc}</p>
      <p className="python27-event-note">
        {tr('Observação da Secretaria de Ocorrências: o imprevisto foi devidamente previsto como possibilidade. A responsabilidade foi encaminhada a um departamento que ainda será criado.', 'Office of Incidents note: the unforeseen event was duly anticipated as a possibility. Responsibility has been forwarded to a department that has yet to be established.')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ev.choices.map((c, i) => (
          <button key={i} className="sec" style={{ textAlign: 'left' }} onClick={() => g.resolveEvent(i)}>
            {c.label}
          </button>
        ))}
      </div>
    </Overlay>
  );
}
