import { DataChip, ScreenTitle } from '../components/ui';
import { mediumLabel, ratingLabel, runtimeLabel } from '../game/labels';
import { useGameState } from '../game/store';
import { money, useLang } from '../i18n';

const clampScore = (v: number, min: number) => Math.min(99, Math.max(min, Math.round(v)));

export function PhoneScreen() {
  const s = useGameState();
  const { tr } = useLang();
  const released = s.projects.filter((p) => p.status === 'released');

  return (
    <>
      <ScreenTitle tab="phone">📱 {tr('Celular do estúdio', 'Studio phone')}</ScreenTitle>
      <p className="muted">{tr('Três aplicativos fictícios inspirados em agregadores de crítica, bases de cinema e ferramentas de auditoria de produção.', 'Three fictional apps inspired by review aggregators, film databases and production audit tools.')}</p>
      <div className="grid-2">
        <div className="card">
          <h3>🍅 {tr('Tomatômetro', 'Tomatometer')}</h3>
          <p className="muted">{tr('Agregador de crítica: aprovação da imprensa, público, consenso e divergência.', 'Review aggregator: press approval, audience, consensus and divergence.')}</p>
          {released.length ? (
            released.map((p) => {
              const critic = clampScore(p.quality + (p.buzz % 17) - 8, 30);
              const aud = clampScore(p.quality + (p.buzz % 21) - 10, 25);
              const consensus = critic > 75 ? tr('aclamação', 'acclaim') : critic > 60 ? tr('recepção positiva', 'positive reception') : critic > 45 ? tr('recepção dividida', 'mixed reception') : tr('recepção negativa', 'negative reception');
              return (
                <div className="phase" key={p.id}>
                  <strong>{p.title}</strong>
                  <div className="data-grid">
                    <DataChip label={tr('Crítica', 'Critics')} value={`${critic}%`} />
                    <DataChip label={tr('Público', 'Audience')} value={`${aud}%`} />
                  </div>
                  <p className="muted">
                    {tr('Consenso', 'Consensus')}: {consensus}.
                  </p>
                </div>
              );
            })
          ) : (
            <p className="muted">{tr('As avaliações surgirão após os primeiros lançamentos.', 'Reviews will appear after your first releases.')}</p>
          )}
        </div>

        <div className="card">
          <h3>🎞️ CineBase</h3>
          <p className="muted">{tr('Ficha técnica, elenco, equipe, duração, classificação, bilheteria, audiência e histórico da franquia.', 'Credits, cast, crew, runtime, rating, box office, audience and franchise history.')}</p>
          {released.length ? (
            released.map((p) => (
              <div className="phase" key={p.id}>
                <strong>{p.title}</strong>
                <p className="muted">
                  {mediumLabel(p)} • {p.genre}
                  {p.secondaryGenre ? ` + ${p.secondaryGenre}` : ''} • {p.filmType || tr('Formato livre', 'Free format')} • {ratingLabel(p)} • {runtimeLabel(p)}
                </p>
                <p>
                  {tr('Direção', 'Director')}: {p.dirName || '—'} • {tr('Protagonismo', 'Lead')}: {p.actName || '—'} • IP: {tr('Original', 'Original')}
                </p>
                <p>
                  {tr('Bilheteria/receita bruta', 'Box office / gross revenue')}: {money(p.totalGross || 0)}
                </p>
              </div>
            ))
          ) : (
            <p className="muted">{tr('Nenhuma ficha técnica disponível.', 'No credits available yet.')}</p>
          )}
        </div>

        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h3>📊 {tr('Relatório de produção', 'Production report')}</h3>
          <p className="muted">{tr('Comparação granular entre orçamento previsto e real, cronograma, roteiro, direção, elenco, animação, som, montagem, marketing, distribuição e recepção.', 'Granular comparison of planned vs. actual budget, schedule, script, direction, cast, animation, sound, editing, marketing, distribution and reception.')}</p>
          {s.projects.length ? (
            s.projects.map((p) => {
              const budget = p.budget * (p.productionCostMultiplier || 1) + (p.overrun || 0) + p.mkt;
              const animation = !p.medium || p.medium === 'live' ? null : clampScore(p.quality + (p.medium === 'anime' ? 5 : -3), 35);
              return (
                <div className="phase" key={p.id}>
                  <strong>{p.title}</strong>
                  <div className="data-grid">
                    <DataChip label={tr('Orçamento total', 'Total budget')} value={money(budget)} />
                    <DataChip label={tr('Roteiro', 'Script')} value={`${p.scriptScore || p.quality}/100`} />
                    <DataChip label={tr('Cronograma', 'Schedule')} value={`${p.delayWeeks || 0} ${tr('sem. atraso', 'wks late')}`} />
                    <DataChip label={tr('Equipe / direção', 'Crew / direction')} value={`${p.quality}/100`} />
                    {animation !== null && <DataChip label={tr('Animação/VFX', 'Animation/VFX')} value={`${animation}/100`} />}
                    <DataChip label="Marketing" value={`${p.buzz}/100`} />
                  </div>
                  <p className="muted">
                    {tr('Auditoria', 'Audit')}:{' '}
                    {(p.overrun || 0) > 0 ? tr('houve estouro de orçamento; avaliar escopo, refação e contingência.', 'budget overrun recorded; review scope, reshoots and contingency.') : tr('sem estouro registrado até o momento.', 'no overrun recorded so far.')}{' '}
                    {p.quality < 65 ? tr('Ponto de atenção: desenvolvimento e revisão criativa.', 'Watch point: development and creative review.') : tr('Ponto forte: qualidade projetada competitiva.', 'Strength: competitive projected quality.')}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="muted">{tr('Relatórios comparativos serão criados ao aprovar projetos.', 'Comparative reports will be created when you greenlight projects.')}</p>
          )}
        </div>
      </div>
    </>
  );
}
