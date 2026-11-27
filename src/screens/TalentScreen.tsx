import { DataChip, ScreenTitle } from '../components/ui';
import { roleLabel, signRetainer, talentMetrics, traitLabel } from '../game/talent';
import { store, useGameState } from '../game/store';
import { money, useLang } from '../i18n';

export function TalentScreen() {
  const s = useGameState();
  const { tr } = useLang();
  return (
    <>
      <ScreenTitle tab="talent">⭐ {tr('Profissionais contratados', 'Hired professionals')}</ScreenTitle>
      <p className="muted">{tr('Elenco e equipe técnica do seu estúdio. Atributos evoluem com a experiência; profissionais também podem se aposentar.', 'Your studio’s cast and crew. Attributes improve with experience; professionals may also retire.')}</p>
      <div className="tooltip-box">
        {tr('A equipe contratada aparece aqui. Um contrato de três projetos garante disponibilidade e desconto de 15%, mas exige adiantamento. Para buscar novos nomes, use a aba Contratação.', 'Your hired team appears here. A three-project contract guarantees availability and a 15% discount, but requires a retainer. To find new professionals, use the Hiring tab.')}
      </div>
      <div className="grid-2">
        {s.talent.map((t) => (
          <div className="card" key={t.id}>
            <div className="space-between">
              <div>
                <strong>{t.name}</strong> <span className="badge">{roleLabel(t.role)}</span>
                <div className="muted">
                  Overall: <strong>{t.overall}</strong> • {tr('Afinidade', 'Affinity')}: <strong>{t.affinity}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{money(t.fee)}</strong>
                <div className="muted">{t.retainer > 0 ? <span style={{ color: 'var(--green)' }}>{tr(`${t.retainer} projetos restantes`, `${t.retainer} projects left`)}</span> : tr('Avulso', 'Freelance')}</div>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              {tr('Característica', 'Trait')}: {traitLabel(t)}
            </div>
            {t.retainer === 0 && (
              <button className="sec small" style={{ marginTop: 8 }} onClick={() => store.act((st) => signRetainer(st, t.id))}>
                {tr('Fechar contrato de 3 projetos', 'Sign 3-project contract')} ({money(t.fee * 0.6)})
              </button>
            )}
            <div className="data-grid">
              {talentMetrics(t).map((m) => (
                <DataChip key={m.label} label={m.label} value={`${m.value}/100`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
