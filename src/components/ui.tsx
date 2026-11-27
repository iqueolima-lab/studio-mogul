import type { CSSProperties, ReactNode } from 'react';
import { DEPARTMENT_NOTES, type TabId } from '../game/content';
import { useLang } from '../i18n';

export function Overlay({ children, id, modalStyle }: { children: ReactNode; id?: string; modalStyle?: CSSProperties }) {
  return (
    <div id={id} className="overlay" role="dialog" aria-modal="true">
      <div className="modal" style={modalStyle}>
        {children}
      </div>
    </div>
  );
}

export function DataChip({ label, value, style }: { label: ReactNode; value: ReactNode; style?: CSSProperties }) {
  return (
    <div className="data-chip" style={style}>
      {label}
      <br />
      <strong>{value}</strong>
    </div>
  );
}

export function Meter({ value, color }: { value: number; color?: string }) {
  return (
    <div className="meter">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card muted">{children}</div>;
}

/** Nota editorial do departamento logo abaixo do título da tela (2.0.7). */
export function DepartmentNote({ tab }: { tab: TabId }) {
  const { tr, trPair } = useLang();
  const note = DEPARTMENT_NOTES[tab];
  if (!note) return null;
  return (
    <aside className="python27-note">
      <strong>
        {tr('NOTA DO DEPARTAMENTO: ', 'DEPARTMENTAL NOTE: ')}
        {trPair(note.title)}
      </strong>
      <span>{trPair(note.text)}</span>
    </aside>
  );
}

/** Título de tela com a nota do departamento. */
export function ScreenTitle({ tab, children, action }: { tab: TabId; children: ReactNode; action?: ReactNode }) {
  return (
    <>
      {action ? (
        <div className="space-between" style={{ marginBottom: 10 }}>
          <h2>{children}</h2>
          {action}
        </div>
      ) : (
        <h2>{children}</h2>
      )}
      <DepartmentNote tab={tab} />
    </>
  );
}
