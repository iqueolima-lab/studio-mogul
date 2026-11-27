import { Empty, ScreenTitle } from '../components/ui';
import { TUTORIAL } from '../game/content';
import { formatLabel, strategyLabel, tierLabel, visualLabel } from '../game/labels';
import { renewSeries, renewalCost } from '../game/release';
import { store, useGameState } from '../game/store';
import { money, useLang } from '../i18n';

function FirstProductionGuide() {
  const s = useGameState();
  const { tr, trPair } = useLang();
  const ex = s.ext;
  if (ex.tutorialDone || !ex.tutorialStarted) return null;
  const i = Math.min(ex.tutorialStep, TUTORIAL.length - 1);
  const item = TUTORIAL[i];
  const last = i === TUTORIAL.length - 1;
  return (
    <div className="card" style={{ borderColor: 'var(--blue)', background: 'rgba(59,130,246,.07)' }}>
      <div className="space-between">
        <strong>🧭 {tr('Guia da primeira produção', 'First production guide')}</strong>
        <span className="badge blue">
          {i + 1}/{TUTORIAL.length}
        </span>
      </div>
      <h3 style={{ marginTop: 8 }}>{trPair(item.title)}</h3>
      <p style={{ fontSize: '.84rem', lineHeight: 1.45, margin: '6px 0 10px' }}>{trPair(item.text)}</p>
      <div className="row">
        <button
          className="small"
          onClick={() =>
            store.mutate((st) => {
              st.ext.tutorialStep++;
              if (st.ext.tutorialStep >= TUTORIAL.length) st.ext.tutorialDone = true;
            })
          }
        >
          {last ? tr('Concluir guia', 'Finish guide') : tr('Próxima dica', 'Next tip')}
        </button>
        <button className="small sec" onClick={() => store.mutate((st) => void (st.ext.tutorialDone = true))}>
          {tr('Dispensar', 'Dismiss')}
        </button>
      </div>
    </div>
  );
}

export function SlateScreen() {
  const s = useGameState();
  const { tr } = useLang();
  const inProd = s.projects.filter((p) => p.status === 'production');
  const released = s.projects.filter((p) => p.status === 'released');

  return (
    <>
      <FirstProductionGuide />
      <ScreenTitle tab="slate" action={<button onClick={() => store.setGreenlightOpen(true)}>+ {tr('Aprovar projeto', 'Greenlight project')}</button>}>
        🎬 {tr('Projetos em andamento e aprovação', 'Active projects & greenlight')}
      </ScreenTitle>
      <div className="tooltip-box">
        <strong>{tr('Dica de produção e distribuição:', 'Production & distribution tip:')}</strong>{' '}
        {tr('Combine o gênero e o tema com mercados em alta para ampliar a bilheteria e o alcance no streaming. Séries geram receita por episódio e podem ganhar novas temporadas!', 'Match genre and theme to trending markets to boost box office and streaming reach. Series earn revenue per episode and can be renewed for new seasons!')}
      </div>

      {inProd.length ? (
        inProd.map((p) => (
          <div className="card" key={p.id}>
            <div className="space-between">
              <div>
                <strong>{p.title}</strong>{' '}
                {p.season ? (
                  <span className="badge blue">
                    {tr('Temporada', 'Season')} {p.season}
                  </span>
                ) : (
                  <span className="badge">{tr('Filme', 'Film')}</span>
                )}
                <div className="muted">
                  {p.genre} • {p.theme} • Dir: {p.dirName}
                </div>
              </div>
              <span className="badge gold">
                {p.weeksLeft} {tr('sem. restantes', 'wks left')}
              </span>
            </div>
            <div className="row" style={{ marginTop: 8, fontSize: '0.78rem' }}>
              <span>
                {tr('Qualidade est.', 'Est. quality')}: <strong>{p.quality}/100</strong>
              </span>
              <span>
                {tr('Expectativa', 'Hype')}: <strong>{p.buzz}</strong>
              </span>
              <span>
                {tr('Estratégia', 'Strategy')}: <strong>{strategyLabel(p)}</strong>
              </span>
            </div>
            <div className="muted">
              {tierLabel(p)} • {p.weeksLeft} {tr('semanas previstas', 'weeks planned')} • {visualLabel(p)}
              {p.episodeCount ? ` • ${p.episodeCount} ${tr('episódios', 'episodes')}` : ''}
              {p.castSize ? ` • ${tr('elenco', 'cast')} ${p.castSize}` : ''}
            </div>
          </div>
        ))
      ) : (
        <Empty>{tr('Nenhum projeto em produção. Toque em “Aprovar projeto” para começar!', 'No projects in production. Click “Greenlight project” to get started!')}</Empty>
      )}

      <h3 style={{ marginTop: 16 }}>{tr('Catálogo lançado e exibição ativa', 'Released catalogue & active runs')}</h3>
      {released.length ? (
        released.map((p) => (
          <div className="card" key={p.id}>
            <div className="space-between">
              <div>
                <strong>{p.title}</strong> {p.season ? <span className="badge blue">S{p.season}</span> : <span className="badge">{formatLabel(p)}</span>}
                <div className="muted">
                  {p.genre} • {tr('Qualidade', 'Quality')} {p.quality}/100 •{' '}
                  {(p.runWeeks || 0) > 0 ? tr(`Em exibição (${p.runWeeks} sem. restantes)`, `Showing (${p.runWeeks} wks left)`) : tr('Catálogo', 'Catalogue')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: p.studioNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {tr('Líquido', 'Net')}: {p.studioNet >= 0 ? '+' : ''}
                  {money(p.studioNet)}
                </div>
                <div className="muted">
                  {tr('Bruto', 'Gross')}: {money(p.totalGross)}
                </div>
              </div>
            </div>
            {p.format === 'series' && p.runWeeks === 0 && (
              <button className="small green" style={{ marginTop: 8 }} onClick={() => store.act((st) => renewSeries(st, p.id))}>
                {tr('Renovar temporada', 'Renew season')} {(p.season || 1) + 1} ({money(renewalCost(s, p))})
              </button>
            )}
          </div>
        ))
      ) : (
        <Empty>{tr('Ainda não há títulos lançados.', 'No released titles yet.')}</Empty>
      )}
    </>
  );
}
