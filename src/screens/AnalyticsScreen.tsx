import { DataChip, Meter, ScreenTitle } from '../components/ui';
import { useGameState } from '../game/store';
import type { RivalHit } from '../game/types';
import { FIRST_YEAR } from '../game/constants';
import { money, useLang } from '../i18n';

function FinanceChart() {
  const s = useGameState();
  const { tr } = useLang();
  const maxVal = Math.max(20, ...s.yearlyStats.map((y) => Math.max(y.rev, y.exp)));
  const bar = (v: number) => Math.round((Math.max(0, v) / maxVal) * 80);
  return (
    <div className="card">
      <h3>{tr('Receita anual vs. despesas (US$ mi)', 'Annual revenue vs. expenses (US$M)')}</h3>
      <div className="chart-bars" role="img" aria-label={tr('Gráfico de receita e despesa por ano', 'Revenue and expense by year chart')}>
        {s.yearlyStats.slice(-8).map((y) => (
          <div className="bar-col" key={y.year}>
            <div className="bar-pair">
              <div className="bar" style={{ height: bar(y.rev), background: 'var(--green)' }} title={`${tr('Receita', 'Revenue')}: ${money(y.rev, 1)}`} />
              <div className="bar" style={{ height: bar(y.exp), background: 'var(--red)' }} title={`${tr('Despesa', 'Expense')}: ${money(y.exp, 1)}`} />
            </div>
            <span className="muted" style={{ fontSize: '0.7rem' }}>
              {FIRST_YEAR - 1 + y.year}
            </span>
          </div>
        ))}
      </div>
      <div className="row muted" style={{ marginTop: 6, fontSize: '0.75rem' }}>
        <span>
          <span style={{ color: 'var(--green)' }}>■</span> {tr('Receita', 'Revenue')}
        </span>
        <span>
          <span style={{ color: 'var(--red)' }}>■</span> {tr('Despesas', 'Expenses')}
        </span>
      </div>
    </div>
  );
}

function IndustryPulse() {
  const s = useGameState();
  const { tr } = useLang();
  const ext = s.ext;
  const fatigue = Object.entries(ext.marketFatigue)
    .filter(([, v]) => v > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const franchises = Object.values(ext.franchiseHype)
    .sort((a, b) => (b.hype || 0) - (a.hype || 0))
    .slice(0, 4);
  const active = s.projects.filter((p) => p.status === 'production');
  const level = (v: number) => (v > 65 ? 'var(--red)' : v > 35 ? 'var(--accent)' : 'var(--green)');

  return (
    <div className="card">
      <h3>🏭 {tr('Pulso da indústria', 'Industry pulse')}</h3>
      <div className="data-grid">
        <DataChip label={tr('Confiança do público', 'Audience trust')} value={`${Math.round(ext.audienceTrust)}/100`} />
        <DataChip label={tr('Produções ativas', 'Active productions')} value={active.length} />
        <DataChip label={tr('Franquias acompanhadas', 'Tracked franchises')} value={Object.keys(ext.franchiseHype).length} />
        <DataChip label={tr('Eventos recentes', 'Recent events')} value={ext.industryEvents.length} />
      </div>
      <div className="grid-2" style={{ marginTop: 8 }}>
        <div>
          <strong>{tr('Fadiga de mercado', 'Market fatigue')}</strong>
          {fatigue.length ? (
            fatigue.map(([g, v]) => (
              <div className="phase" key={g}>
                <div className="space-between">
                  <span>{g}</span>
                  <strong>{Math.round(v)}/100</strong>
                </div>
                <Meter value={v} color={level(v)} />
              </div>
            ))
          ) : (
            <p className="muted">{tr('Mercados descansados; sem saturação relevante.', 'Markets are refreshed; no significant saturation.')}</p>
          )}
        </div>
        <div>
          <strong>{tr('Histórico de produções', 'Production history')}</strong>
          {franchises.length ? (
            franchises.map((f) => (
              <div className="phase" key={f.key}>
                <strong>{f.name}</strong>
                <p className="muted">
                  {f.entries} {tr('lançamento(s)', 'release(s)')} • hype {Math.round(f.hype)}/100 • {tr('confiança', 'trust')} {Math.round(f.trust)}/100
                </p>
              </div>
            ))
          ) : (
            <p className="muted">{tr('Seus primeiros sucessos ainda vão construir uma marca reconhecível.', 'Your first hits will build a recognisable brand.')}</p>
          )}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>{tr('Condição das equipes', 'Team condition')}</strong>
        {active.length ? (
          active.map((p) => (
            <div className="phase" key={p.id}>
              <div className="space-between">
                <strong>{p.title}</strong>
                <span className="muted">
                  {Math.round(p.teamFatigue || 0)}% {tr('desgaste', 'fatigue')}
                </span>
              </div>
              <Meter value={p.teamFatigue || 0} color={(p.teamFatigue || 0) > 70 ? 'var(--red)' : 'var(--green)'} />
              <p className="muted">
                {tr('Coesão', 'Cohesion')} {Math.round(p.teamCohesion || 0)}/100 • {tr('risco de conflito', 'conflict risk')} {Math.round(p.egoRisk || 0)}/100
              </p>
            </div>
          ))
        ) : (
          <p className="muted">{tr('Nenhuma equipe está em produção neste momento.', 'No teams are currently in production.')}</p>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>{tr('Últimos acontecimentos', 'Latest developments')}</strong>
        {ext.industryEvents.length ? (
          ext.industryEvents.slice(0, 5).map((e, i) => (
            <p className="muted" key={i}>
              • {e.message}{' '}
              <span style={{ opacity: 0.7 }}>
                ({e.year}, {tr('semana', 'week')} {e.week})
              </span>
            </p>
          ))
        ) : (
          <p className="muted">{tr('O mercado ainda não registrou acontecimentos extraordinários.', 'The market has no notable developments yet.')}</p>
        )}
      </div>
    </div>
  );
}

export function AnalyticsScreen() {
  const s = useGameState();
  const { tr } = useLang();
  const hits: RivalHit[] = [
    ...s.projects.filter((p) => p.totalGross > 0).map((p) => ({ title: p.title, studio: s.studioName, gross: p.totalGross })),
    ...s.rivals.flatMap((r) => r.hits),
  ]
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 6);

  return (
    <>
      <ScreenTitle tab="analytics">📊 {tr('Análise financeira e rankings', 'Financial analysis & rankings')}</ScreenTitle>
      <FinanceChart />
      <div className="card">
        <h3>🏆 {tr('Maiores bilheterias e sucessos', 'Top box-office performers & hits')}</h3>
        <table>
          <thead>
            <tr>
              <th>{tr('Título', 'Title')}</th>
              <th>{tr('Estúdio', 'Studio')}</th>
              <th>{tr('Bilheteria', 'Box office')}</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((h, i) => (
              <tr key={`${h.title}-${i}`}>
                <td>{h.title}</td>
                <td>{h.studio}</td>
                <td>
                  <strong>{money(h.gross, 1)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <IndustryPulse />
    </>
  );
}
