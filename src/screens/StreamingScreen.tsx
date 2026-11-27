import { DataChip, ScreenTitle } from '../components/ui';
import { STREAMING_COST, STREAMING_YEAR } from '../game/constants';
import { adjustSubPrice, buildStreamingPlatform, streamingWeeklyGross, streamingWeeklyNet } from '../game/operations';
import { store, useGameState } from '../game/store';
import { historicalYear } from '../game/utils';
import { money, useLang } from '../i18n';

function StreamingPanel() {
  const s = useGameState();
  const { tr } = useLang();
  const year = historicalYear(s);
  const st = s.streaming;

  if (!st.built) {
    const open = year >= STREAMING_YEAR;
    const remaining = Math.max(0, STREAMING_COST - s.cash);
    return (
      <div className="card">
        <div className="space-between">
          <h3>StreamVault+ • {tr('projeto de plataforma', 'platform project')}</h3>
          <span className="badge gold">{open ? tr('Aguardando investimento', 'Awaiting investment') : tr('Indisponível', 'Unavailable')}</span>
        </div>
        <p className="muted">
          {open
            ? tr('A janela histórica abriu. Você decide quando comprometer capital para entrar no mercado.', 'The historical window is open. You decide when to commit capital to enter the market.')
            : tr('A distribuição por streaming ainda não está disponível nesta etapa da campanha. O mercado abre em 2008.', 'Streaming distribution is not available yet at this point in the campaign. The market opens in 2008.')}
        </p>
        <div className="data-grid">
          <DataChip label={tr('Implantação global', 'Global launch')} value={money(STREAMING_COST, 0)} />
          <DataChip label={tr('Infraestrutura', 'Infrastructure')} value={tr('6 regiões', '6 regions')} />
          <DataChip label={tr('Operação semanal', 'Weekly operations')} value={money(st.weeklyOperations)} />
          <DataChip label={tr('Caixa disponível', 'Available cash')} value={money(s.cash)} />
        </div>
        {open ? (
          <>
            <p className="muted">
              {remaining > 0 ? tr(`Faltam ${money(remaining)} para atingir o investimento inicial.`, `${money(remaining)} short of the initial investment.`) : tr('Capital disponível para implantação.', 'Capital available for launch.')}{' '}
              {tr('A operação não garante lucro: assinantes crescem com catálogo, marketing e adequação ao público, e podem cancelar.', 'Operations do not guarantee profit: subscribers grow with catalogue, marketing and audience fit, and they can cancel.')}
            </p>
            <button className="green" disabled={s.cash < STREAMING_COST} onClick={() => store.act(buildStreamingPlatform, true)}>
              {tr('Lançar plataforma', 'Launch platform')} • {money(STREAMING_COST, 0)}
            </button>
          </>
        ) : (
          <p className="muted">{tr('Planeje seu caixa: o desbloqueio histórico acontece em 2008 (ano 49 da campanha).', 'Plan your cash: the historical unlock happens in 2008 (campaign year 49).')}</p>
        )}
      </div>
    );
  }

  const gross = streamingWeeklyGross(s);
  const net = streamingWeeklyNet(s);
  return (
    <div className="card">
      <div className="space-between">
        <h3>StreamVault+</h3>
        <span className="badge green">
          {tr('Em operação desde', 'Running since')} {st.launchYear}
        </span>
      </div>
      <div className="muted">
        {tr('Assinatura mensal', 'Monthly subscription')}: <strong>${s.subPrice.toFixed(2)}</strong> • {tr('Cancelamento semanal estimado', 'Estimated weekly churn')}: <strong>{(st.weeklyChurn * 100).toFixed(2)}%</strong>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="sec small" onClick={() => store.act((x) => adjustSubPrice(x, -2))}>
          {tr('-$2 no plano', '-$2 on plan')}
        </button>
        <button className="sec small" onClick={() => store.act((x) => adjustSubPrice(x, 2))}>
          {tr('+$2 no plano', '+$2 on plan')}
        </button>
      </div>
      <div className="data-grid" style={{ marginTop: 10 }}>
        <DataChip label={tr('Regiões atendidas', 'Regions served')} value="6 / 6" />
        <DataChip label={tr('Custo operacional semanal', 'Weekly operating cost')} value={money(st.weeklyOperations)} />
        <DataChip label={tr('Receita bruta semanal', 'Weekly gross revenue')} value={money(gross)} />
        <DataChip label={tr('Resultado semanal estimado', 'Estimated weekly result')} value={<span style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(net)}</span>} />
      </div>
      <p className="muted">
        {tr('A plataforma não gera renda fixa. O resultado depende dos assinantes ativos, preço, cancelamento e catálogo. O ponto de equilíbrio atual é aproximadamente', 'The platform has no fixed income. Results depend on active subscribers, price, churn and catalogue. The current break-even point is roughly')}{' '}
        {((st.weeklyOperations * 4.3) / s.subPrice).toFixed(2)} {tr('milhões de assinantes.', 'million subscribers.')}
      </p>
    </div>
  );
}

export function StreamingScreen() {
  const s = useGameState();
  const { tr } = useLang();
  return (
    <>
      <ScreenTitle tab="streaming">📺 {tr('Plataforma de streaming e sala de roteiristas', 'Streaming platform & writers’ room')}</ScreenTitle>
      <StreamingPanel />
      <div className="grid-2" style={{ marginTop: 10 }}>
        <div className="stat-box">
          {tr('Assinantes ativos', 'Active subscribers')}: <span className="stat-val">{s.subs.toFixed(2)}M</span>
        </div>
        <div className="stat-box">
          {tr('Receita semanal líquida', 'Weekly net revenue')}: <span className="stat-val">{money(streamingWeeklyNet(s))}</span>
        </div>
      </div>
      <h3 style={{ marginTop: 12 }}>{tr('Estúdios rivais e premiações anuais', 'Rival studios & annual awards')}</h3>
      <div className="card">
        {s.rivals.map((r) => {
          const hit = r.hits[r.hits.length - 1];
          return (
            <div key={r.name} className="space-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>{r.name}</strong> <span className="muted">(Rep {r.rep})</span>
              </div>
              <div className="muted">
                {tr('Maior sucesso', 'Latest hit')}: {hit.title} ({money(hit.gross, 1)})
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
