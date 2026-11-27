import { useState } from 'react';
import { DataChip, Empty, Meter } from '../components/ui';
import { GENRE_45 } from '../game/constants';
import { ROLE_LABELS, TIER_NAMES, TIER_REP, hireProfessional, maxTier, roleLabel, talentMetrics, traitLabel } from '../game/talent';
import { store, useGameState } from '../game/store';
import type { Role } from '../game/types';
import { money, useLang } from '../i18n';

export function HiringScreen() {
  const s = useGameState();
  const { tr, trPair } = useLang();
  const [role, setRole] = useState<'all' | Role>('all');
  const [genre, setGenre] = useState('all');
  const market = s.ext.proTalent;
  const current = maxTier(s);
  const available = market.pool
    .filter((t) => (role === 'all' || t.role === role) && (genre === 'all' || t.affinity === genre) && t.tier <= current)
    .sort((a, b) => b.overall - a.overall);

  return (
    <>
      <h2>🧑‍💼 {tr('Mercado de contratação', 'Hiring market')}</h2>
      <div className="card">
        <div className="space-between">
          <div>
            <strong>
              {tr('Reputação do estúdio', 'Studio reputation')}: {s.rep}/100
            </strong>
            <div className="muted">
              {tr('Faixa atual', 'Current tier')}: {trPair(TIER_NAMES[current])}
            </div>
          </div>
          <span className="badge gold">{tr('Atualização trimestral', 'Quarterly refresh')}</span>
        </div>
        <Meter value={s.rep} />
        <p className="muted">{tr('O mercado se renova a cada 12 semanas (três meses). A reputação limita quais faixas de profissionais podem aparecer.', 'The market refreshes every 12 weeks (three months). Reputation gates which professional tiers can appear.')}</p>
        <p className="muted">
          {tr('Próxima faixa', 'Next tier')}:{' '}
          {current < 5 ? `${trPair(TIER_NAMES[current + 1])} — ${TIER_REP[current + 1]} ${tr('de reputação', 'reputation')}` : tr('Prestígio máximo desbloqueado', 'Maximum prestige unlocked')}
        </p>
      </div>

      <div className="card">
        <div className="grid-2">
          <label>
            {tr('Área profissional', 'Professional area')}
            <select value={role} onChange={(e) => setRole(e.target.value as 'all' | Role)}>
              <option value="all">{tr('Todas as áreas', 'All areas')}</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((k) => (
                <option key={k} value={k}>
                  {roleLabel(k)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr('Afinidade de gênero', 'Genre affinity')}
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="all">{tr('Todos os gêneros', 'All genres')}</option>
              {GENRE_45.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted">{tr('Lista em ordem decrescente de overall. O overall considera os cinco atributos da área; fama é exibida separadamente como sexto atributo.', 'Ranked by overall, highest first. Overall uses the five area attributes; fame is displayed separately as the sixth attribute.')}</p>
      </div>

      <div className="muted">
        {available.length} {tr('profissionais disponíveis', 'available professionals')} • {tr('mercado', 'market')} {market.refreshCount + 1}
      </div>
      {available.length ? (
        available.map((t) => (
          <div className="card" key={t.id}>
            <div className="space-between">
              <div>
                <strong>{t.name}</strong> <span className="badge">{roleLabel(t.role)}</span>
                <div className="muted">
                  {traitLabel(t)} • {tr('Gênero', 'Genre')}: {t.affinity}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{t.overall}/100</strong>
                <div className="muted">{money(t.fee)}</div>
              </div>
            </div>
            <div className="data-grid">
              {talentMetrics(t).map((m) => (
                <DataChip key={m.label} label={m.label} value={`${m.value}/100`} />
              ))}
            </div>
            <button className="small green" style={{ marginTop: 8 }} onClick={() => store.act((st) => hireProfessional(st, t.id), true)}>
              {tr('Contratar', 'Hire')} • {money(t.fee)}
            </button>
          </div>
        ))
      ) : (
        <Empty>{tr('Nenhum profissional corresponde aos filtros nesta faixa. Experimente outra área ou gênero, ou aumente a reputação do estúdio.', 'No professionals match these filters at this tier. Try another area or genre, or build studio reputation.')}</Empty>
      )}
    </>
  );
}
