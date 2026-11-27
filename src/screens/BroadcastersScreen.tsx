import { DataChip } from '../components/ui';
import {
  DEAL_TYPES,
  HYPE_OPTIONS,
  dealValue,
  hasDeal,
  investHype,
  keyFor,
  releasedSeries,
  scoreForSeries,
  selectSeries,
  selectSeriesSection,
  selectedSeries,
  signBroadcastDeal,
} from '../game/franchise';
import { visualLabel } from '../game/labels';
import { store, useGameState } from '../game/store';
import type { HypeKind, SeriesSection } from '../game/types';
import { money, useLang } from '../i18n';

function HypeButtons({ franchiseKey }: { franchiseKey: string }) {
  const { tr } = useLang();
  const buttons: { kind: HypeKind; label: string; cls: string }[] = [
    { kind: 'teaser', label: 'Teaser', cls: 'small' },
    { kind: 'trailer', label: 'Trailer', cls: 'small' },
    { kind: 'press', label: tr('Imprensa', 'Press'), cls: 'small sec' },
  ];
  return (
    <div className="row" style={{ flexWrap: 'wrap' }}>
      {buttons.map((b) => (
        <button key={b.kind} className={b.cls} onClick={() => store.act((s) => investHype(s, franchiseKey, b.kind))}>
          {b.label} · {money(HYPE_OPTIONS[b.kind].cost)}
        </button>
      ))}
    </div>
  );
}

function SeriesDetail() {
  const s = useGameState();
  const { tr } = useLang();
  const p = selectedSeries(s);
  if (!p) return <div className="card muted">{tr('Nenhuma série lançada ainda. A emissora está aguardando conteúdo, café e uma decisão administrativa.', 'No released series yet. The network is awaiting content, coffee and an administrative decision.')}</div>;
  const f = s.ext.franchiseHype[keyFor(p)] ?? null;
  const section = s.ext.selectedSeriesSection;
  const tabs: [SeriesSection, string][] = [
    ['audience', tr('Audiência', 'Audience')],
    ['hype', 'Hype'],
    ['ratings', tr('Notas', 'Ratings')],
    ['report', tr('Relatório de produção', 'Production report')],
  ];

  return (
    <div className="card">
      <div className="space-between">
        <div>
          <h3>{p.title}</h3>
          <p className="muted">
            {p.genre} · {tr('Temporada', 'Season')} {p.season || 1} · {scoreForSeries(p)}/100
          </p>
        </div>
        <span className="badge gold">{tr('Série selecionada', 'Selected series')}</span>
      </div>
      <div className="row" style={{ flexWrap: 'wrap', margin: '10px 0' }}>
        {tabs.map(([id, label]) => (
          <button key={id} className={`small ${section === id ? '' : 'sec'}`} onClick={() => store.mutate((st) => selectSeriesSection(st, id), false)}>
            {label}
          </button>
        ))}
      </div>

      {section === 'audience' && (
        <>
          <div className="data-grid">
            <DataChip label={tr('Índice de audiência', 'Audience index')} value={`${scoreForSeries(p)}/100`} />
            <DataChip label={tr('Episódios', 'Episodes')} value={p.episodeCount || 8} />
            <DataChip label={tr('Temporada', 'Season')} value={p.season || 1} />
            <DataChip label={tr('Receita acumulada', 'Cumulative gross')} value={money(p.totalGross || 0)} />
          </div>
          <p className="muted">{tr('A audiência é uma leitura comparativa da recepção, não uma garantia de renovação.', 'Audience is a comparative reception indicator, not a renewal guarantee.')}</p>
        </>
      )}
      {section === 'hype' && f && (
        <>
          <div className="data-grid">
            <DataChip label={tr('Hype da franquia', 'Franchise hype')} value={`${Math.round(f.hype || 0)}/100`} />
            <DataChip label={tr('Conhecimento público', 'Public awareness')} value={`${Math.round(f.awareness || 0)}/100`} />
            <DataChip label={tr('Confiança', 'Trust')} value={`${Math.round(f.trust || 0)}/100`} />
          </div>
          <p className="muted">{tr('O hype cresce com divulgação e projetos em andamento, sobe ou desaba conforme a recepção e esfria quando a franquia some do radar.', 'Hype grows through promotion and active projects, rises or collapses with reception, and cools when a franchise disappears from the public eye.')}</p>
          <HypeButtons franchiseKey={f.key} />
        </>
      )}
      {section === 'ratings' && (
        <>
          <div className="data-grid">
            <DataChip label={tr('Crítica', 'Critics')} value={`${p.criticScore ?? Math.round((p.quality || 50) * 0.85)}%`} />
            <DataChip label={tr('Público', 'Audience')} value={`${p.audienceScore ?? scoreForSeries(p)}%`} />
            <DataChip label={tr('Qualidade interna', 'Internal quality')} value={`${p.quality || 0}/100`} />
          </div>
          <p className="muted">{tr('As notas são indicadores simulados de recepção; não representam avaliações reais.', 'Scores are simulated reception indicators, not real-world reviews.')}</p>
        </>
      )}
      {section === 'report' && (
        <>
          <div className="data-grid">
            <DataChip label={tr('Orçamento', 'Budget')} value={money(p.budget || 0)} />
            <DataChip label={tr('Cronograma', 'Schedule')} value={`${p.totalWeeks || p.scaleScheduleWeeks || '—'} ${tr('semanas', 'weeks')}`} />
            <DataChip label={tr('Estilo visual', 'Visual style')} value={visualLabel(p)} />
            <DataChip label={tr('Formato', 'Format')} value={p.episodeRuntime || '—'} />
          </div>
          <p className="muted">
            {tr('Equipe', 'Crew')}: {p.dirName || '—'} · {tr('Protagonista', 'Lead')}: {p.actName || '—'} · {tr('Elenco', 'Cast')}: {p.castSize || '—'}
          </p>
          <p>{p.productionMemo || tr('A produção não deixou memorando. O memorando também não deixou explicações.', 'No production memo was filed. The memo also offered no explanation.')}</p>
          <p className="muted">
            {tr('Sinopse', 'Synopsis')}: {p.synopsis || '—'}
          </p>
        </>
      )}
    </div>
  );
}

function Deals() {
  const s = useGameState();
  const { tr, trPair } = useLang();
  const p = selectedSeries(s);
  const deals = s.ext.broadcastDeals;
  return (
    <div className="card">
      <h3>📜 {tr('Contratos e direitos licenciados', 'Licensing contracts and rights')}</h3>
      {p && (
        <>
          <p className="muted">
            {tr('Negociando direitos da série selecionada:', 'Negotiating rights for selected series:')} <strong>{p.title}</strong>
          </p>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {DEAL_TYPES.map((d) => {
              const exists = hasDeal(s, p.id, d.type);
              const v = dealValue(s, p, d.type);
              return (
                <button key={d.type} className={`small ${exists ? 'sec' : ''}`} disabled={exists} onClick={() => store.act((st) => signBroadcastDeal(st, p.id, d.type))}>
                  {exists ? tr('Já licenciado', 'Already licensed') : trPair(d.action)} · +{money(v.advance)}
                </button>
              );
            })}
          </div>
        </>
      )}
      {deals.length ? (
        deals
          .slice()
          .reverse()
          .map((d) => (
            <div className="phase" key={d.id}>
              <strong>
                {d.seriesTitle} — {d.name}
              </strong>
              <p className="muted">
                {tr('Adiantamento', 'Advance')}: {money(d.advance)} · Royalties: {money(d.weeklyRoyalty, 3)}/{tr('4 semanas', '4 weeks')} · {tr('Recebido em royalties', 'Royalties received')}: {money(d.paid || 0)}
              </p>
            </div>
          ))
      ) : (
        <p className="muted">{tr('Nenhum contrato assinado. Os advogados estão descansando, pela primeira vez na história.', 'No contracts signed. The lawyers are resting, for the first time in history.')}</p>
      )}
    </div>
  );
}

export function BroadcastersScreen() {
  const s = useGameState();
  const { tr } = useLang();
  const board = Object.values(s.ext.franchiseHype).sort((a, b) => (b.hype || 0) - (a.hype || 0));
  const series = releasedSeries(s);
  const selected = selectedSeries(s);

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <h2>📡 {tr('Emissoras de TV aberta', 'Free-to-air broadcasters')}</h2>
        <p className="muted">{tr('A vitrine comercial onde séries ganham novas janelas, produtos licenciados e oportunidades de transformar audiência em patrimônio. A papelada é gratuita; a papelada errada, não.', 'The commercial hub where series gain new windows, licensed products and opportunities to turn audiences into assets. Paperwork is free; the wrong paperwork is not.')}</p>
      </div>

      <div className="card">
        <h3>📈 {tr('Painel de hype das franquias', 'Franchise hype board')}</h3>
        {board.length ? (
          board.map((f) => (
            <div className="phase" key={f.key}>
              <div className="space-between">
                <strong>{f.name}</strong>
                <span className="badge gold">Hype {Math.round(f.hype || 0)}/100</span>
              </div>
              <p className="muted">
                {f.entries || 0} {tr('lançamento(s)', 'release(s)')} · {tr('conhecimento', 'awareness')} {Math.round(f.awareness || 0)}/100 · {tr('confiança', 'trust')} {Math.round(f.trust || 0)}/100
              </p>
              <HypeButtons franchiseKey={f.key} />
            </div>
          ))
        ) : (
          <p className="muted">{tr('As franquias aparecerão aqui depois de seus primeiros lançamentos.', 'Franchises will appear here after their first releases.')}</p>
        )}
      </div>

      <div className="card">
        <h3>📚 {tr('Biblioteca de séries', 'Series library')}</h3>
        <p className="muted">{tr('Ordenada pela avaliação numérica de audiência, da maior para a menor. Selecione uma série para abrir seu dossiê.', 'Sorted by numerical audience score, highest to lowest. Select a series to open its dossier.')}</p>
        {series.length ? (
          series.map((p) => (
            <div
              key={p.id}
              className="phase clickable"
              role="button"
              tabIndex={0}
              style={selected?.id === p.id ? { borderColor: 'var(--accent)' } : undefined}
              onClick={() => store.mutate((st) => selectSeries(st, p.id), false)}
              onKeyDown={(e) => e.key === 'Enter' && store.mutate((st) => selectSeries(st, p.id), false)}
            >
              <div className="space-between">
                <strong>{p.title}</strong>
                <span className="badge blue">{scoreForSeries(p)}/100</span>
              </div>
              <p className="muted">
                {p.genre} · {tr('Temporada', 'Season')} {p.season || 1} · Hype {Math.round(s.ext.franchiseHype[keyFor(p)]?.hype ?? 0)}/100
              </p>
            </div>
          ))
        ) : (
          <p className="muted">{tr('Ainda não há séries lançadas. A biblioteca permanece vazia por motivos artísticos e administrativos.', 'No released series yet. The library remains empty for artistic and administrative reasons.')}</p>
        )}
      </div>

      <SeriesDetail />
      <Deals />

      <div className="card">
        <h3>🗂️ {tr('Registro de hype das franquias', 'Franchise hype ledger')}</h3>
        {s.ext.hypeLog.length ? (
          s.ext.hypeLog.slice(0, 10).map((x, i) => (
            <div className="phase" key={i}>
              <span className="muted">
                {x.year} · {tr('S', 'W')}
                {x.week}
              </span>
              <p>{x.message}</p>
            </div>
          ))
        ) : (
          <p className="muted">{tr('Nenhum movimento de hype registrado. O silêncio também é uma estratégia, embora raramente rentável.', 'No hype activity recorded. Silence is also a strategy, though rarely a profitable one.')}</p>
        )}
      </div>
    </>
  );
}
