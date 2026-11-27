import { DataChip, Empty, ScreenTitle } from '../components/ui';
import { crewMetricLabels, crewRoleLabel, formatLabel, mediumLabel, phaseName, ratingLabel, riskLabel, runtimeLabel, scriptLabel } from '../game/labels';
import { useGameState } from '../game/store';
import { money, useLang } from '../i18n';

export function PipelineScreen() {
  const s = useGameState();
  const { tr } = useLang();
  const projects = s.projects.filter((p) => p.status === 'production');
  const seasonal = s.ext.seasonal.slice(-5);

  return (
    <>
      <ScreenTitle tab="pipeline">🏗️ {tr('Desenvolvimento e pipeline de produção', 'Development & production pipeline')}</ScreenTitle>
      <div className="tooltip-box">
        {tr('Cada formato tem etapas, prazos, dependências, custos e riscos próprios. Avançar uma semana processa o cronograma; atrasos, refações e mudanças de escopo podem aumentar o orçamento.', 'Each format has its own phases, deadlines, dependencies, costs and risks. Advancing a week processes the schedule; delays, reshoots and scope changes can increase the budget.')}
      </div>

      {seasonal.length > 0 && (
        <div className="card">
          <h3>{tr('Eventos sazonais recentes', 'Recent seasonal events')}</h3>
          {seasonal.map((e, i) => (
            <div className="phase" key={`${e.year}-${e.week}-${i}`}>
              <strong>
                {tr(e.name, e.nameEn || e.name)} • {tr('Semana', 'Week')} {e.week}
              </strong>
              <p className="muted">{tr(e.effect, e.effectEn || e.effect)}</p>
            </div>
          ))}
        </div>
      )}

      {projects.length ? (
        projects.map((p) => (
          <div className="card" key={p.id}>
            <div className="space-between">
              <strong>{p.title}</strong>
              <span className="badge gold">
                {mediumLabel(p)} • {p.weeksLeft} {tr('semanas restantes', 'weeks left')}
              </span>
            </div>
            <p className="muted">
              {tr('Obra original', 'Original work')} • {p.genre}
              {p.secondaryGenre ? ` + ${p.secondaryGenre}` : ''} • {p.filmType || tr('Formato livre', 'Free format')} • {formatLabel(p)} • {ratingLabel(p)} • {runtimeLabel(p)}
            </p>
            {(p.workflow || []).map((ph, i) => (
              <div key={i} className={`phase ${ph.done ? 'done' : i === p.phaseIndex ? 'current' : ''}`}>
                <div className="space-between">
                  <strong>
                    {i + 1}. {phaseName(ph)}
                  </strong>
                  <span className="muted">{ph.done ? tr('Concluída', 'Done') : `${ph.weeks} ${tr('sem.', 'wks')}`}</span>
                </div>
                <div className="muted">
                  {tr('Orçamento alocado', 'Allocated budget')}: {money(p.budget * ph.share)} • {tr('Risco', 'Risk')}: {riskLabel(ph.risk)}
                </div>
              </div>
            ))}
            <div className="data-grid">
              <DataChip label={tr('Orçamento-base', 'Base budget')} value={money(p.budget)} />
              <DataChip label={tr('Custo adicional', 'Additional cost')} value={money(p.overrun || 0)} />
              <DataChip label={tr('Qualidade estimada', 'Estimated quality')} value={`${p.quality}/100`} />
              <DataChip label={tr('Roteiro', 'Script')} value={scriptLabel(p)} />
            </div>
            <div className="phase">
              <strong>{tr('Equipe selecionada', 'Selected crew')}</strong>
              {(p.crewMetrics || []).map((cm) => {
                const labels = crewMetricLabels(cm);
                return (
                  <p className="muted" key={cm.role}>
                    {crewRoleLabel(cm)}: {cm.name || tr('equipe interna', 'in-house crew')} • {cm.metrics.map((m, i) => `${labels[i] ?? m.label}: ${m.value}`).join(' / ')}
                  </p>
                );
              })}
            </div>
            <div className="phase">
              <strong>{tr('Roteiro e decisões criativas', 'Script & creative decisions')}</strong>
              <p className="muted">{p.synopsis || tr('Sem sinopse cadastrada.', 'No synopsis on file.')}</p>
              <p className="muted">{(p.episodeScripts || []).join(' • ') || tr('Nenhum resumo por episódio cadastrado.', 'No episode summaries on file.')}</p>
              {p.crossoverWith && (
                <p className="muted">
                  {tr('Crossover', 'Crossover')}: {p.crossoverWith} (+{p.crossoverBonus} {tr('expectativa', 'hype')})
                </p>
              )}
              {!!p.characterRoster?.length && (
                <p className="muted">
                  {tr('Personagens recorrentes', 'Recurring characters')}: {p.characterRoster.map((c) => c.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <Empty>{tr('Nenhuma produção ativa. Aprove um projeto para abrir seu pipeline detalhado.', 'No active productions. Greenlight a project to open its detailed pipeline.')}</Empty>
      )}
    </>
  );
}
