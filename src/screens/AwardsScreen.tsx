import { ScreenTitle } from '../components/ui';
import { AWARDS } from '../game/constants';
import { useLang } from '../i18n';

export function AwardsScreen() {
  const { tr, trPair } = useLang();
  return (
    <>
      <ScreenTitle tab="awards">🏆 {tr('Calendário de premiações', 'Awards calendar')}</ScreenTitle>
      <div className="tooltip-box">
        {tr('As datas do jogo são calculadas em semanas do calendário fictício. Cada premiação tem janela de elegibilidade, cerimônia, categorias e requisitos próprios por formato.', 'In-game dates are counted in weeks of the fictional calendar. Each award has its own eligibility window, ceremony, categories and format requirements.')}
      </div>
      {AWARDS.map((a) => (
        <div className="card" key={a.name}>
          <div className="space-between">
            <strong>{a.name}</strong>
            <span className="badge blue">
              {tr('Semana', 'Week')} {a.week}
            </span>
          </div>
          <p className="muted">
            {tr('Elegibilidade', 'Eligibility')}: {trPair(a.eligibility)}
          </p>
          <p>{trPair(a.categories)}</p>
          <p className="muted">{tr('Inscrição, campanha de consideração e envio de cópias podem gerar custos e exigem lançamento dentro da janela elegível.', 'Submission, consideration campaigns and screeners may incur costs and require a release within the eligibility window.')}</p>
        </div>
      ))}
    </>
  );
}
