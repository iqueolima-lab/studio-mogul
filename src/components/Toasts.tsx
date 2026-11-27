import { useGame } from '../game/store';

export function Toasts() {
  const g = useGame();
  if (!g.toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {g.toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
