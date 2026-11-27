/* Textos editoriais: notas dos departamentos (2.0.7), dicas de submenu e tutorial (2.0.1), dificuldades */
import type { Pair } from './constants';
import type { Difficulty } from './types';

export type TabId =
  | 'slate'
  | 'markets'
  | 'pipeline'
  | 'library'
  | 'talent'
  | 'hiring'
  | 'streaming'
  | 'awards'
  | 'broadcasters'
  | 'analytics'
  | 'phone';

export type GroupId = 'projects' | 'management' | 'production' | 'distribution' | 'insights';

export const NAV_GROUPS: { id: GroupId; icon: string; label: Pair; tabs: { id: TabId; label: Pair }[] }[] = [
  { id: 'projects', icon: '🎬', label: ['Projetos', 'Projects'], tabs: [{ id: 'slate', label: ['🎬 Projetos', '🎬 Projects'] }] },
  { id: 'management', icon: '🏢', label: ['Gestão', 'Management'], tabs: [{ id: 'markets', label: ['🗺️ Mercados', '🗺️ Markets'] }] },
  {
    id: 'production',
    icon: '🎥',
    label: ['Produção', 'Production'],
    tabs: [
      { id: 'pipeline', label: ['✨ Pipeline', '✨ Pipeline'] },
      { id: 'library', label: ['📖 Biblioteca', '📖 Library'] },
      { id: 'talent', label: ['🌟 Talentos', '🌟 Talent'] },
      { id: 'hiring', label: ['🧑‍💼 Contratação', '🧑‍💼 Hiring'] },
    ],
  },
  {
    id: 'distribution',
    icon: '🌎',
    label: ['Distribuição', 'Distribution'],
    tabs: [
      { id: 'streaming', label: ['🍿 Streaming e rivais', '🍿 Streaming & rivals'] },
      { id: 'awards', label: ['🏅 Premiações', '🏅 Awards'] },
      { id: 'broadcasters', label: ['📡 Emissoras', '📡 Broadcasters'] },
    ],
  },
  {
    id: 'insights',
    icon: '📊',
    label: ['Central', 'Hub'],
    tabs: [
      { id: 'analytics', label: ['📈 Análises', '📈 Analytics'] },
      { id: 'phone', label: ['📲 Celular', '📲 Studio phone'] },
    ],
  },
];

export const groupOf = (tab: TabId): GroupId => NAV_GROUPS.find((g) => g.tabs.some((t) => t.id === tab))?.id ?? 'projects';

export const DEPARTMENT_NOTES: Partial<Record<TabId, { title: Pair; text: Pair }>> = {
  slate: { title: ['Projetos', 'Projects'], text: ['Cada filme começa com uma ideia, um orçamento e a convicção de que desta vez alguém leu o contrato.', 'Every film begins with an idea, a budget and the conviction that someone has read the contract this time.'] },
  markets: { title: ['Mercados', 'Markets'], text: ['O público tem preferências. O mercado tem tendências. Ambos mudam de opinião sem preencher formulário.', 'Audiences have preferences. Markets have trends. Both change their minds without filing paperwork.'] },
  talent: { title: ['Talentos', 'Talent'], text: ['Pessoas extraordinárias, cachês extraordinários e uma quantidade estatisticamente improvável de sobrenomes suspeitos.', 'Extraordinary people, extraordinary fees and a statistically suspicious number of surnames.'] },
  pipeline: { title: ['Pipeline', 'Pipeline'], text: ['A produção avança por etapas. O caos também, mas não consta no cronograma oficial.', 'Production advances in phases. So does chaos, although it is not listed on the official schedule.'] },
  library: { title: ['Biblioteca', 'Library'], text: ['Gêneros, formatos e propriedades. A biblioteca não julga suas escolhas. O catálogo talvez faça comentários.', 'Genres, formats and properties. The library does not judge your choices. The catalogue may comment.'] },
  streaming: { title: ['Streaming e rivais', 'Streaming & rivals'], text: ['Uma plataforma própria: porque administrar um estúdio aparentemente não oferecia oportunidades suficientes de falência criativa.', 'A streaming platform of your own: because running a studio apparently did not offer enough opportunities for creative insolvency.'] },
  awards: { title: ['Premiações', 'Awards'], text: ['A campanha pode render prestígio. Também pode render uma fatura. A academia não aceita pagamento em exposição.', 'A campaign may bring prestige. It may also bring an invoice. The academy does not accept exposure as payment.'] },
  analytics: { title: ['Análises', 'Analytics'], text: ['Os números não mentem. Às vezes omitem contexto, mas mentir exigiria uma reunião que ainda não foi marcada.', 'Numbers do not lie. Sometimes they omit context, but lying would require a meeting that has not been scheduled.'] },
  phone: { title: ['Celular do estúdio', 'Studio phone'], text: ['Relatórios, alertas e mensagens. A tecnologia finalmente encontrou uma maneira de entregar más notícias em alta definição.', 'Reports, alerts and messages. Technology has finally found a way to deliver bad news in high definition.'] },
};

export const SUBMENU_TIPS: Record<TabId, Pair> = {
  slate: ['Projetos: aprove produções e acompanhe seus lançamentos.', 'Projects: greenlight productions and track releases.'],
  markets: ['Mercados: compare tendências de gênero e tema antes de escolher sua estratégia.', 'Markets: compare genre and theme trends before choosing a strategy.'],
  talent: ['Talentos: avalie atributos, afinidade e custo total da equipe.', 'Talent: weigh attributes, affinity and the team’s total cost.'],
  hiring: ['Contratação: encontre novos profissionais; a reputação libera faixas mais altas.', 'Hiring: find new professionals; reputation unlocks higher tiers.'],
  pipeline: ['Pipeline: acompanhe cada etapa, prazo, risco e orçamento alocado.', 'Pipeline: track each phase, schedule, risk and allocated budget.'],
  library: ['Biblioteca: consulte formatos e gêneros desbloqueados.', 'Library: browse unlocked formats, genres and properties.'],
  streaming: ['Distribuição: avalie cinema, streaming e contexto competitivo.', 'Distribution: review theatrical, streaming and competitive context.'],
  awards: ['Premiações: planeje visibilidade sem ignorar o custo de campanha.', 'Awards: plan visibility without overlooking campaign costs.'],
  broadcasters: ['Emissoras: transforme séries em contratos de exibição e licenciamento.', 'Broadcasters: turn series into broadcast and licensing deals.'],
  analytics: ['Análises: transforme resultados em decisões para os próximos projetos.', 'Analytics: turn results into decisions for future projects.'],
  phone: ['Celular: consulte relatórios e pistas detalhadas da produção.', 'Studio phone: read reports and detailed production clues.'],
};

export const TUTORIAL: { title: Pair; text: Pair }[] = [
  { title: ['1. Aprove sua primeira produção', '1. Greenlight your first production'], text: ['Toque em “Aprovar projeto”. Escolha gênero, tema, formato, porte, marketing e equipe. Não existe combinação universalmente perfeita; se existisse, o departamento de criatividade já teria sido substituído por uma calculadora. A calculadora pediu férias.', 'Click “Greenlight project”. Choose genre, theme, format, scale, marketing and crew. There is no universally perfect combination; if there were, the creative department would have been replaced by a calculator. The calculator asked for a holiday.'] },
  { title: ['2. Confira o pipeline', '2. Check the pipeline'], text: ['Depois de aprovar, abra Produção → Pipeline. Veja as etapas, os prazos e os riscos previstos para sua produção. O cronograma é uma previsão, não uma promessa feita sob juramento.', 'After greenlighting, open Production → Pipeline. Review the phases, schedule and estimated risks. The schedule is a forecast, not a promise made under oath.'] },
  { title: ['3. Leia os sinais do mercado', '3. Read the market signals'], text: ['Em Gestão → Mercados, observe tendências. Em Produção → Talentos, compare afinidade, atributos e cachês. O talento ideal existe; infelizmente, também conhece o próprio valor.', 'In Management → Markets, watch trends. In Production → Talent, compare affinity, attributes and fees. The ideal talent exists; unfortunately, it also knows its own worth.'] },
  { title: ['4. Acompanhe sem poluir a tela', '4. Follow updates without clutter'], text: ['Os insights chegam à Caixa de entrada. Avisos médios e altos ficam ativos; os de baixa importância começam desativados. A caixa de entrada foi instruída a não transformar cada espirro da indústria em uma emergência nacional.', 'Insights arrive in the Inbox. Medium and high priority alerts are active; low-priority ones start disabled. The inbox has been instructed not to turn every industry sneeze into a national emergency.'] },
  { title: ['5. Avance no seu ritmo', '5. Advance at your own pace'], text: ['Use “Pular semana” quando terminar de analisar. Consulte Análises e o Celular para entender os resultados e ajustar decisões. O relógio não será acelerado até que a gerência tenha terminado de olhar para ele.', 'Use “Skip week” when you are ready. Check Analytics and the Studio phone to understand results and adjust decisions. The clock will not speed up until management has finished looking at it.'] },
];

export const DIFFICULTY_COPY: Record<Difficulty, { summary: Pair; details: Pair }> = {
  standard: {
    summary: ['Produtor de Primeira Viagem: comece com US$ 20 milhões e uma quantidade administrável de caos. Fadiga de mercado, desgaste das equipes e eventos da indústria seguem as taxas-base. Um começo equilibrado para aprender fazendo, sem passeio no parque.', 'First-Time Producer: start with US$ 20 million and a manageable amount of chaos. Market fatigue, crew strain and industry events use baseline rates. A balanced way to learn the ropes without the game holding your hand.'],
    details: ['O caos vem em doses administráveis. Mercado, equipes, atrasos e eventos seguem as taxas-base. É o melhor ponto de partida para aprender fazendo — mas ninguém vai segurar sua mão na hora de aprovar um orçamento duvidoso.', 'Chaos comes in manageable doses. Markets, crews, delays and events use baseline rates. A balanced starting point for learning by doing — but nobody will hold your hand when you approve a questionable budget.'],
  },
  indie: {
    summary: ['Fudido, Pé-Rapado & Ambicioso: comece com US$ 20 milhões e descubra que cada centavo tem dono. Os mercados saturam mais rápido, as equipes cansam antes, as crises aparecem com maior frequência e a recuperação demora. Improviso é bem-vindo; planejamento é altamente recomendado.', 'Broke, Scrappy & Ambitious: start with US$ 20 million and discover that every dollar has a job. Markets saturate faster, crews tire sooner, crises show up more often and recovery takes longer. Improvisation is welcome; a plan is highly recommended.'],
    details: ['O dinheiro evapora, o mercado satura depressa, a equipe pede arrego e as crises parecem ter seu endereço. A recuperação é lenta e o boca a boca ajuda menos. Aqui, improvisar é uma arte; sobreviver é uma profissão.', 'Money vanishes, markets saturate quickly, crews run out of steam and crises seem to know your address. Recovery is slower and word of mouth is less generous. Improvisation is an art; survival is a profession.'],
  },
  tycoon: {
    summary: ['Magnata de Chinelo: comece com US$ 20 milhões, mercados mais tranquilos, equipes menos pressionadas, menos crises e franquias com mais fôlego. Experimente, arrisque na criatividade e construa seu império sem precisar dormir de terno.', 'Flip-Flop Mogul: start with US$ 20 million, softer market fatigue, less crew strain, fewer crises and stronger franchise momentum. Experiment, take creative risks and build your empire at a more relaxed pace.'],
    details: ['O mercado é mais paciente, as equipes aguentam mais, as crises aparecem menos e as franquias mantêm o fôlego. Ideal para testar ideias, brincar de magnata e construir um império sem transformar cada semana numa reunião de emergência.', 'The market is more forgiving, crews are less strained, crises are rarer and franchises keep their momentum. Ideal for testing ideas and building an empire without turning every week into an emergency meeting.'],
  },
};
