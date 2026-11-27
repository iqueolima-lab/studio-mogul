import { ScreenTitle } from '../components/ui';
import { marketName, unlockMarket } from '../game/operations';
import { store, useGameState } from '../game/store';
import { money, useLang } from '../i18n';

export function MarketsScreen() {
  const s = useGameState();
  const { tr } = useLang();
  return (
    <>
      <ScreenTitle tab="markets">🌍 {tr('Mercados globais (tendências mensais)', 'Global markets (monthly trends)')}</ScreenTitle>
      <div className="tooltip-box">
        <strong>{tr('Como funcionam os mercados:', 'How markets work:')}</strong>{' '}
        {tr('A cada 4 semanas (um mês), os 6 mercados atualizam seus gêneros e temas em alta. Desbloquear a distribuição regional exige pagar localização e dublagem, mas amplia o alcance no cinema e no streaming.', 'Every 4 weeks (one month), the 6 markets refresh their trending genres and themes. Unlocking regional distribution requires paying for localisation and dubbing, but widens theatrical and streaming reach.')}
      </div>
      <div className="grid-2">
        {s.markets.map((m) => {
          const themes = m.themes || [m.theme];
          return (
            <div className="card" key={m.id} style={{ borderColor: m.unlocked ? 'var(--green)' : 'var(--border)' }}>
              <div className="space-between">
                <strong>{marketName(m)}</strong>
                <span className={`badge ${m.unlocked ? 'green' : ''}`}>{m.unlocked ? tr('Ativo', 'Active') : tr(`Desbloquear por ${money(m.locCost)}`, `Unlock for ${money(m.locCost)}`)}</span>
              </div>
              <div className="muted" style={{ margin: '6px 0' }}>
                {tr('Peso do mercado', 'Market weight')}: <strong>{m.size}x</strong>
              </div>
              <div className="row">
                <span className="badge gold">
                  {tr('Gênero em alta', 'Hot genre')}: {m.genre}
                </span>
                <span className="badge blue">
                  {tr('Temas em alta', 'Trending themes')}: {themes.slice(0, 3).join(', ')}
                  {themes.length > 3 ? ` +${themes.length - 3}` : ''}
                </span>
              </div>
              {!m.unlocked && (
                <button className="small" style={{ marginTop: 10, width: '100%' }} onClick={() => store.act((st) => unlockMarket(st, m.id))}>
                  {tr('Pagar localização e dublagem', 'Pay for localisation & dubbing')} ({money(m.locCost)})
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
