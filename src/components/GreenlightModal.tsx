import { useMemo, useState, type ReactNode } from 'react';
import {
  BUDGET_OPTIONS,
  CREW_FIELD_LABELS,
  CREW_ROLES,
  MEDIUM_OPTIONS,
  MKT_OPTIONS,
  RATINGS,
  SCRIPT_OPTIONS,
  THEMES,
  VISUAL_STYLES,
} from '../game/constants';
import { computeTotal, confirmGreenlight, defaultForm, lengthOptions, unlockedFilmTypes, unlockedGenres, type GreenlightForm } from '../game/greenlight';
import { store, useGameState } from '../game/store';
import { computeSynergy, synergyLevel } from '../game/synergy';
import type { CrewRole, Format, Medium, Strategy } from '../game/types';
import { money, useLang } from '../i18n';
import { Overlay } from './ui';

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1/-1' } : undefined}>
      <label className="muted">{label}</label>
      {children}
    </div>
  );
}

export function GreenlightModal() {
  const s = useGameState();
  const { tr, trPair } = useLang();
  const [form, setForm] = useState<GreenlightForm>(() => defaultForm(s));
  const set = <K extends keyof GreenlightForm>(key: K, value: GreenlightForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setCrew = (role: CrewRole, id: string) => setForm((f) => ({ ...f, crew: { ...f.crew, [role]: id } }));

  const genres = unlockedGenres(s);
  const filmTypes = unlockedFilmTypes(s);
  const total = computeTotal(s, form);
  const synergy = useMemo(() => computeSynergy(form.genre, form.theme, form.secondaryGenre, form.filmType), [form.genre, form.theme, form.secondaryGenre, form.filmType]);
  const directors = s.talent.filter((t) => t.role === 'Director');
  const actors = s.talent.filter((t) => t.role === 'Actor');

  const setFormat = (format: Format) =>
    setForm((f) => {
      const opts = lengthOptions(format);
      return { ...f, format, length: opts.some((o) => o.value === f.length) ? f.length : format === 'series' ? 'ep_standard' : 'feature' };
    });

  const close = () => store.setGreenlightOpen(false);
  const confirm = () => {
    const ok = store.act((st) => confirmGreenlight(st, form), true);
    if (ok) close();
  };

  const talentOption = (t: (typeof directors)[number]) => (
    <option key={t.id} value={t.id}>
      {t.name} • {t.overall}/100 • {t.affinity} • {money(t.fee)}
      {t.retainer > 0 ? tr(' [Com contrato]', ' [Contracted]') : ''}
    </option>
  );

  return (
    <Overlay id="greenlight-modal">
      <div className="space-between" style={{ marginBottom: 10 }}>
        <h2>🎬 {tr('Aprovar nova produção', 'Greenlight a new production')}</h2>
        <button className="sec small" onClick={close} aria-label={tr('Fechar', 'Close')}>
          ✕
        </button>
      </div>

      <div className="grid-2">
        <Field label={tr('Título', 'Title')}>
          <input type="text" value={form.title} placeholder={tr('ex.: Protocolo Estelar', 'e.g., Starfall Protocol')} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label={tr('Formato', 'Format')}>
          <select value={form.format} onChange={(e) => setFormat(e.target.value as Format)}>
            <option value="movie">{tr('Longa-metragem', 'Feature film')}</option>
            <option value="series">{tr('Série de TV/streaming', 'TV/streaming series')}</option>
          </select>
        </Field>
        <Field label={tr('Gênero', 'Genre')}>
          <select value={form.genre} onChange={(e) => set('genre', e.target.value)}>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label={tr('Tema (80 opções narrativas)', 'Theme (80 narrative options)')}>
          <select value={form.theme} onChange={(e) => set('theme', e.target.value)}>
            {THEMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label={tr('Porte de produção', 'Production scale')}>
          <select value={form.budget} onChange={(e) => set('budget', Number(e.target.value))}>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {trPair(b.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Campanha de marketing', 'Marketing campaign')}>
          <select value={form.mkt} onChange={(e) => set('mkt', Number(e.target.value))}>
            {MKT_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {trPair(m.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Subgênero / segundo gênero', 'Subgenre / second genre')}>
          <select value={form.secondaryGenre} onChange={(e) => set('secondaryGenre', e.target.value)}>
            <option value="none">{tr('Sem segundo gênero', 'No second genre')}</option>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label={tr('Tipo de filme (450 combinações)', 'Film type (450 combinations)')}>
          <select value={form.filmType} onChange={(e) => set('filmType', e.target.value)}>
            {filmTypes.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>

        <div style={{ gridColumn: '1/-1' }} className="card">
          <strong>🧭 {tr('Radar de sinergia criativa', 'Creative synergy radar')}</strong>
          <div className="data-grid" style={{ marginTop: 8 }}>
            {synergy.map((c) => {
              const lv = synergyLevel(c.score);
              return (
                <div key={c.label} className="data-chip" style={{ background: lv.bg, color: lv.fg, border: `1px solid ${lv.fg}33` }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{c.score}/100</div>
                  <div style={{ fontSize: '.68rem', fontWeight: 800 }}>{lv.label}</div>
                </div>
              );
            })}
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            {tr('Avisos consultivos: as cores não alteram automaticamente qualidade, orçamento ou bilheteria.', 'Advisory only: colours do not change quality, budget or box office.')}
          </div>
        </div>

        <Field label={tr('Tipo de produção', 'Production type')}>
          <select value={form.medium} onChange={(e) => set('medium', e.target.value as Medium)}>
            {MEDIUM_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {trPair(m.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Duração / episódios', 'Runtime / episodes')}>
          <select value={form.length} onChange={(e) => set('length', e.target.value)}>
            {lengthOptions(form.format).map((l) => (
              <option key={l.value} value={l.value}>
                {trPair(l.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Estilo visual', 'Visual style')}>
          <select value={form.visualStyle} onChange={(e) => set('visualStyle', e.target.value)}>
            {VISUAL_STYLES.map((v) => (
              <option key={v.value} value={v.value}>
                {trPair(v.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Tamanho do elenco principal', 'Main cast size')}>
          <input type="number" min={1} max={30} step={1} value={form.castSize} onChange={(e) => set('castSize', Number(e.target.value))} />
          <small className="muted">{tr('Inclui protagonistas e coadjuvantes contratados.', 'Includes hired leads and supporting cast.')}</small>
        </Field>
        {form.format === 'series' && (
          <Field label={tr('Episódios por temporada', 'Episodes per season')}>
            <input type="number" min={6} max={100} step={1} value={form.episodeCount} onChange={(e) => set('episodeCount', Number(e.target.value))} />
            <small className="muted">{tr('Mínimo de 6 episódios. O número escolhido altera custo, equipe e cronograma.', 'Minimum 6 episodes. The number changes cost, crew and schedule.')}</small>
          </Field>
        )}
        <Field label={tr('Crossover / universo compartilhado', 'Crossover / shared universe')}>
          <input type="text" value={form.crossover} placeholder={tr('Nome da franquia ou produção relacionada (opcional)', 'Related franchise or production name (optional)')} onChange={(e) => set('crossover', e.target.value)} />
        </Field>
        <Field label={tr('Personagens recorrentes', 'Recurring characters')}>
          <input type="text" value={form.characterNotes} placeholder={tr('Personagens secundários e terciários (opcional)', 'Secondary and tertiary characters (optional)')} onChange={(e) => set('characterNotes', e.target.value)} />
        </Field>
        <Field label={tr('Classificação indicativa', 'Age rating')}>
          <select value={form.rating} onChange={(e) => set('rating', e.target.value)}>
            {RATINGS.map((r) => (
              <option key={r.value} value={r.value}>
                {trPair(r.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Escopo de roteiro', 'Script scope')}>
          <select value={form.script} onChange={(e) => set('script', e.target.value)}>
            {SCRIPT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {trPair(o.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('Premissa / sinopse de produção', 'Premise / production synopsis')} full>
          <textarea rows={2} value={form.synopsis} placeholder={tr('Conflito central, protagonista, objetivo e diferencial...', 'Central conflict, protagonist, goal and hook...')} onChange={(e) => set('synopsis', e.target.value)} />
        </Field>
        <Field label={tr('Roteiro simplificado por episódio (um episódio por linha)', 'Simplified script per episode (one episode per line)')} full>
          <textarea rows={3} value={form.episodeScripts} placeholder={tr('E01 — apresentação do conflito; E02 — complicação; E03 — virada...', 'E01 — conflict set-up; E02 — complication; E03 — twist...')} onChange={(e) => set('episodeScripts', e.target.value)} />
        </Field>

        {CREW_ROLES.map((role) => {
          const list = s.talent.filter((t) => t.role === role);
          return (
            <Field key={role} label={trPair(CREW_FIELD_LABELS[role])}>
              <select value={form.crew[role]} onChange={(e) => setCrew(role, e.target.value)}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} • overall {t.overall} • {money(t.fee)}
                  </option>
                ))}
                {!list.length && <option value="">{tr('Equipe interna / improviso', 'In-house crew / improvisation')}</option>}
              </select>
            </Field>
          );
        })}
        <Field label={tr('Diretor / showrunner', 'Director / showrunner')}>
          <select value={form.dirId} onChange={(e) => set('dirId', e.target.value)}>
            {directors.map(talentOption)}
          </select>
        </Field>
        <Field label={tr('Protagonista', 'Lead actor')}>
          <select value={form.actId} onChange={(e) => set('actId', e.target.value)}>
            {actors.map(talentOption)}
          </select>
        </Field>
      </div>

      <div style={{ marginTop: 10 }}>
        <label className="muted">{tr('Estratégia de lançamento', 'Release strategy')}</label>
        <select value={form.strategy} onChange={(e) => set('strategy', e.target.value as Strategy)}>
          <option value="theatrical">{tr('Cinema primeiro → janela de streaming', 'Theatrical first → streaming window')}</option>
          <option value="streaming">{tr('Original exclusivo de streaming (atrai assinantes)', 'Streaming exclusive original (attracts subscribers)')}</option>
        </select>
      </div>

      <div className="card" style={{ marginTop: 12, background: 'var(--bg)' }}>
        <div className="space-between">
          <span>{tr('Custo inicial total:', 'Total upfront cost:')}</span>
          <strong style={{ color: 'var(--accent)', fontSize: '1.05rem' }}>{money(total)}</strong>
        </div>
        <div className="muted" style={{ marginTop: 4 }}>
          {tr('Inclui escala, duração, equipe selecionada, direção, elenco e marketing. Valores ajustados pelo escopo.', 'Includes scale, runtime, selected crew, director, cast and marketing. Costs scale with scope.')}
          {total > s.cash && <strong style={{ color: 'var(--red)' }}> {tr('Acima do caixa disponível.', 'Above available cash.')}</strong>}
        </div>
      </div>
      <button style={{ width: '100%', padding: 11 }} onClick={confirm}>
        {tr('Assinar contratos e iniciar produção', 'Sign contracts and start production')}
      </button>
    </Overlay>
  );
}
