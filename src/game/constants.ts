import type { BudgetTier, CrewRole, Market, Medium, Rival } from './types';

/** Par de textos [português, inglês]. */
export type Pair = readonly [string, string];

export const GAME_VERSION = '2.2.0';
/** Chave do save antigo no localStorage (migrado para o IndexedDB na primeira abertura). */
export const SAVE_KEY = 'studio_mogul_save_v1';
export const MODE_KEY = 'studio_mogul_simulation_mode';
export const AUDIO_KEY = 'studioMogulAudio';

export const STARTING_CASH = 20;
export const WEEKS_PER_YEAR = 52;
export const FIRST_YEAR = 1960;
export const STREAMING_YEAR = 2008;
export const STREAMING_COST = 750;
export const STREAMING_OPS = 2.4;
export const STREAMING_CHURN = 0.008;

export const GENRE_45 = `Ação|Aventura|Drama|Comédia|Comédia romântica|Terror|Terror psicológico|Suspense|Thriller|Mistério|Crime|Policial|Ficção científica|Space opera|Cyberpunk|Fantasia|Fantasia urbana|Fantasia épica|Distopia|Utopia|Romance|Melodrama|Histórico|Épico|Guerra|Faroeste|Musical|Biografia|Documentário|Mockumentary|Animação infantil|Animação adulta|Anime de ação|Slice of life|Esporte|Artes marciais|Super-herói|Sobrenatural|Folk horror|Gótico|Noir|Neo-noir|Coming-of-age|Sobrevivência|Experimental`.split(
  '|',
);

export const FILM_STYLES = `realista|estilizado|minimalista|épico|intimista|procedural|antológico|road movie|musical|documental`.split('|');
export const FILM_TYPES = GENRE_45.flatMap((g) => FILM_STYLES.map((st) => `${g} — ${st}`));

export const THEMES = [
  'Cyberpunk', 'Time Travel', 'Family Legacy', 'Heist', 'Dystopia', 'Found Family', 'Conspiracy', 'Space Opera',
  'Forbidden Love', 'Coming of Age', 'Revenge', 'Redemption', 'Survival', 'Identity Crisis', 'First Contact', 'Artificial Intelligence',
  'Corporate Greed', 'Political Corruption', 'Class Divide', 'Social Rebellion', 'Lost Civilization', 'Ancient Prophecy', 'Mythic Quest', 'Chosen One',
  'Parallel Worlds', 'Alternate History', 'Time Loop', 'Time Paradox', 'Alien Invasion', 'Interstellar Exploration', 'Post-Apocalypse', 'Climate Collapse',
  'Haunted Past', 'Supernatural Mystery', 'Occult Secrets', 'Cursed Bloodline', 'Monster Within', 'Psychological Breakdown', 'Unreliable Narrator', 'Hidden Identity',
  'Secret Society', 'Espionage', 'Undercover Operation', 'Political Intrigue', 'Legal Justice', 'Moral Dilemma', 'Ethical Experiment', 'Scientific Discovery',
  'Medical Breakthrough', 'Technological Singularity', 'Virtual Reality', 'Digital Afterlife', 'Human Enhancement', 'Robot Rebellion', 'Mutant Society', 'Genetic Legacy',
  'Wilderness Journey', 'Oceanic Adventure', 'Arctic Expedition', 'Desert Odyssey', 'Treasure Hunt', 'Survival Island', 'Road Trip', 'Escape Room',
  'Sports Rivalry', 'Underdog Triumph', 'Rags to Riches', 'Rise and Fall', 'Betrayal', 'Unlikely Friendship', 'Sibling Rivalry', 'Parenthood',
  'Generational Conflict', 'Small-Town Secrets', 'Rural Isolation', 'Urban Alienation', 'Showbiz Satire', 'Workplace Chaos', 'Cultural Clash', 'Immigration Journey',
];

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Especial'];
export const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Special'];

/**
 * Gêneros em alta nos mercados. No HTML original os mercados usavam nomes em inglês
 * ("Action", "Sci-Fi") enquanto os projetos usavam a lista em português, então o bônus
 * de gênero nunca era aplicado. Aqui ambos usam os mesmos nomes.
 */
export const MARKET_GENRES = ['Ficção científica', 'Ação', 'Drama', 'Comédia', 'Terror', 'Fantasia', 'Thriller', 'Crime'];
export const LEGACY_GENRE_MAP: Record<string, string> = {
  'Sci-Fi': 'Ficção científica',
  Action: 'Ação',
  Drama: 'Drama',
  Comedy: 'Comédia',
  Horror: 'Terror',
  Fantasy: 'Fantasia',
  Thriller: 'Thriller',
  Crime: 'Crime',
};

export const MARKET_NAMES: Record<string, Pair> = {
  na: ['América do Norte', 'North America'],
  eu: ['Europa', 'Europe'],
  as: ['Ásia', 'Asia'],
  sa: ['América do Sul', 'South America'],
  af: ['África', 'Africa'],
  oc: ['Oceania', 'Oceania'],
};

export const INITIAL_MARKETS: Omit<Market, 'themes'>[] = [
  { id: 'na', name: 'North America', size: 1.35, locCost: 0, unlocked: true, genre: 'Ação', theme: 'Conspiracy' },
  { id: 'eu', name: 'Europe', size: 1.2, locCost: 1.2, unlocked: false, genre: 'Drama', theme: 'Family Legacy' },
  { id: 'as', name: 'Asia', size: 1.45, locCost: 1.5, unlocked: false, genre: 'Ficção científica', theme: 'Cyberpunk' },
  { id: 'sa', name: 'South America', size: 0.85, locCost: 0.8, unlocked: false, genre: 'Thriller', theme: 'Heist' },
  { id: 'af', name: 'Africa', size: 0.75, locCost: 0.7, unlocked: false, genre: 'Ação', theme: 'Dystopia' },
  { id: 'oc', name: 'Oceania', size: 0.65, locCost: 0.6, unlocked: false, genre: 'Comédia', theme: 'Found Family' },
];

export const RIVAL_STUDIOS: Rival[] = [
  { name: 'Titan Global', cash: 45, rep: 78, hits: [{ title: 'Nebula Dawn', studio: 'Titan Global', gross: 142.5 }] },
  { name: 'Silverline Media', cash: 32, rep: 65, hits: [{ title: 'Crimson Tideway', studio: 'Silverline Media', gross: 98.0 }] },
  { name: 'Nova Indie', cash: 18, rep: 52, hits: [{ title: 'Midnight Echo', studio: 'Nova Indie', gross: 64.2 }] },
];

/** Etapas por tipo de produção: [nome pt, nome en, semanas-base, fatia do orçamento]. */
export const PHASE_TEMPLATES: Record<Medium, [string, string, number, number][]> = {
  live: [
    ['Desenvolvimento e direitos', 'Development & rights', 5, 0.08],
    ['Roteiro e revisões', 'Script & revisions', 6, 0.1],
    ['Financiamento e greenlight', 'Financing & greenlight', 3, 0.05],
    ['Pré-produção e elenco', 'Pre-production & casting', 5, 0.15],
    ['Filmagem principal', 'Principal photography', 6, 0.38],
    ['Montagem e pós-produção', 'Editing & post-production', 9, 0.16],
    ['Marketing, classificação e distribuição', 'Marketing, rating & distribution', 6, 0.08],
  ],
  western_animation: [
    ['Conceito e desenvolvimento', 'Concept & development', 6, 0.08],
    ['Roteiros e revisão editorial', 'Scripts & editorial review', 8, 0.12],
    ['Design visual e storyboard', 'Visual design & storyboard', 8, 0.16],
    ['Animatic e aprovação', 'Animatic & approval', 5, 0.1],
    ['Layout e animação', 'Layout & animation', 18, 0.28],
    ['Composição, dublagem e som', 'Compositing, voice & sound', 8, 0.12],
    ['Pós, QC e entrega', 'Post, QC & delivery', 5, 0.08],
    ['Marketing e distribuição', 'Marketing & distribution', 4, 0.06],
  ],
  anime: [
    ['Planejamento e comitê de produção', 'Planning & production committee', 5, 0.07],
    ['Roteiro e composição de série', 'Script & series composition', 6, 0.1],
    ['Design, cenários e storyboard', 'Design, backgrounds & storyboard', 7, 0.14],
    ['Animatic e layouts', 'Animatic & layouts', 5, 0.1],
    ['Animação-chave e intermediária', 'Key & in-between animation', 16, 0.3],
    ['Colorização e composição', 'Colouring & compositing', 7, 0.1],
    ['Dublagem, música e mixagem', 'Voice, music & mixing', 5, 0.08],
    ['Controle de qualidade e entrega', 'Quality control & delivery', 3, 0.05],
    ['Lançamento e distribuição', 'Release & distribution', 3, 0.06],
  ],
  hybrid: [
    ['Desenvolvimento e prova de conceito', 'Development & proof of concept', 6, 0.08],
    ['Roteiro e planejamento técnico', 'Script & technical planning', 6, 0.12],
    ['Pré-produção live-action e assets', 'Live-action pre-production & assets', 7, 0.16],
    ['Filmagem e captura', 'Shooting & capture', 6, 0.24],
    ['Animação, VFX e integração', 'Animation, VFX & integration', 14, 0.22],
    ['Montagem, som e finalização', 'Editing, sound & finishing', 8, 0.12],
    ['QC, marketing e distribuição', 'QC, marketing & distribution', 5, 0.06],
  ],
  stopmotion: [
    ['Desenvolvimento e roteiro', 'Development & script', 6, 0.08],
    ['Design, bonecos e cenários', 'Design, puppets & sets', 14, 0.25],
    ['Animatic e testes de câmera', 'Animatic & camera tests', 5, 0.08],
    ['Animação quadro a quadro', 'Frame-by-frame animation', 24, 0.35],
    ['Composição, som e montagem', 'Compositing, sound & editing', 8, 0.14],
    ['QC e lançamento', 'QC & release', 5, 0.1],
  ],
  documentary: [
    ['Pesquisa e desenvolvimento', 'Research & development', 5, 0.12],
    ['Acesso, autorizações e financiamento', 'Access, clearances & financing', 5, 0.12],
    ['Filmagem e entrevistas', 'Shooting & interviews', 8, 0.3],
    ['Montagem e verificação factual', 'Editing & fact-checking', 8, 0.24],
    ['Som, cor e finalização', 'Sound, colour & finishing', 4, 0.1],
    ['Distribuição e lançamento', 'Distribution & release', 4, 0.12],
  ],
};

export interface AwardInfo {
  name: string;
  eligibility: Pair;
  week: number;
  categories: Pair;
}

export const AWARDS: AwardInfo[] = [
  { name: 'Oscar', eligibility: ['Filmes live-action e animação', 'Live-action and animated films'], week: 9, categories: ['Melhor filme, direção, roteiro, atuação, animação, som, montagem e trilha', 'Best picture, directing, writing, acting, animation, sound, editing and score'] },
  { name: 'BAFTA Film Awards', eligibility: ['Cinema internacional', 'International cinema'], week: 7, categories: ['Filme, direção, roteiro, atuação, fotografia, edição, animação e efeitos', 'Film, directing, writing, acting, cinematography, editing, animation and effects'] },
  { name: 'Globo de Ouro', eligibility: ['Cinema e TV', 'Film and TV'], week: 2, categories: ['Drama, comédia/musical, TV, atuação, roteiro e animação', 'Drama, comedy/musical, TV, acting, writing and animation'] },
  { name: 'Emmy', eligibility: ['Séries e televisão', 'Series and television'], week: 36, categories: ['Drama, comédia, minissérie, animação, roteiro, direção e categorias técnicas', 'Drama, comedy, limited series, animation, writing, directing and craft categories'] },
  { name: 'Annie Awards', eligibility: ['Animação', 'Animation'], week: 5, categories: ['Longa, TV, direção, roteiro, storyboard, personagem, música e efeitos', 'Feature, TV, directing, writing, storyboard, character, music and effects'] },
  { name: 'Festival de Cannes', eligibility: ['Cinema autoral e internacional', 'Auteur and international cinema'], week: 20, categories: ['Palma de Ouro, direção, roteiro, atuação e prêmios paralelos', "Palme d'Or, directing, screenplay, acting and parallel awards"] },
  { name: 'Festival de Veneza', eligibility: ['Cinema internacional', 'International cinema'], week: 35, categories: ['Leão de Ouro, direção, roteiro, atuação e júri', 'Golden Lion, directing, screenplay, acting and jury'] },
  { name: 'Festival de Berlim', eligibility: ['Cinema internacional', 'International cinema'], week: 8, categories: ['Urso de Ouro, direção, roteiro e atuação', 'Golden Bear, directing, screenplay and acting'] },
  { name: 'Critics Choice', eligibility: ['Cinema e TV', 'Film and TV'], week: 4, categories: ['Cinema, televisão, animação, roteiro, direção e atuação', 'Film, television, animation, writing, directing and acting'] },
  { name: 'Saturn Awards', eligibility: ['Fantasia, ficção científica e terror', 'Fantasy, science fiction and horror'], week: 40, categories: ['Filme, série, atuação, efeitos, animação e franquias', 'Film, series, acting, effects, animation and franchises'] },
  { name: 'Prêmios BAFTA TV', eligibility: ['Televisão', 'Television'], week: 19, categories: ['Série, minissérie, atuação, roteiro e categorias técnicas', 'Series, limited series, acting, writing and craft categories'] },
  { name: 'Prêmios do Anime do Ano', eligibility: ['Anime', 'Anime'], week: 12, categories: ['Anime do ano, direção, roteiro, personagem, trilha e animação', 'Anime of the year, directing, writing, character, score and animation'] },
];

export interface MediumOption {
  value: Medium;
  label: Pair;
  short: Pair;
  /** Multiplicador de custo de produção. */
  costFactor: number;
  /** Multiplicador de cronograma. */
  scheduleFactor: number;
}

export const MEDIUM_OPTIONS: MediumOption[] = [
  { value: 'live', label: ['Live-action', 'Live-action'], short: ['Live-action', 'Live-action'], costFactor: 1, scheduleFactor: 1 },
  { value: 'western_animation', label: ['Animação ocidental 2D/3D', 'Western 2D/3D animation'], short: ['Animação ocidental', 'Western animation'], costFactor: 1.18, scheduleFactor: 1.08 },
  { value: 'anime', label: ['Anime japonês', 'Japanese anime'], short: ['Anime', 'Anime'], costFactor: 1.12, scheduleFactor: 1.0 },
  { value: 'hybrid', label: ['Híbrido live-action/animação', 'Live-action/animation hybrid'], short: ['Híbrido', 'Hybrid'], costFactor: 1.28, scheduleFactor: 1.08 },
  { value: 'stopmotion', label: ['Stop-motion', 'Stop-motion'], short: ['Stop-motion', 'Stop-motion'], costFactor: 1.35, scheduleFactor: 1.12 },
  { value: 'documentary', label: ['Documentário', 'Documentary'], short: ['Documentário', 'Documentary'], costFactor: 0.82, scheduleFactor: 0.9 },
];

export interface LengthOption {
  value: string;
  label: Pair;
  runtime: string;
  /** Fator de duração usado no custo. */
  factor: number;
  /** Carga extra de escala (somente filmes). */
  runtimeLoad?: number;
  /** Fator de cronograma (somente séries). */
  schedule?: number;
}

export const MOVIE_LENGTHS: LengthOption[] = [
  { value: 'short', label: ['Curta-metragem • 10–15 min', 'Short film • 10–15 min'], runtime: '10–15 min', factor: 0.65, runtimeLoad: -0.12 },
  { value: 'mediumfilm', label: ['Média-metragem • 20–75 min', 'Medium-length film • 20–75 min'], runtime: '20–75 min', factor: 0.82, runtimeLoad: -0.05 },
  { value: 'feature', label: ['Longa-metragem • 80–130 min', 'Feature film • 80–130 min'], runtime: '80–130 min', factor: 1, runtimeLoad: 0 },
  { value: 'epic', label: ['Escala épica • 140 min ou mais', 'Epic scale • 140+ min'], runtime: '140+ min', factor: 1.55, runtimeLoad: 0.22 },
];

export const SERIES_LENGTHS: LengthOption[] = [
  { value: 'ep_short', label: ['Episódios curtos • 5–15 min', 'Short episodes • 5–15 min'], runtime: '5–15 min', factor: 0.72, schedule: 0.92 },
  { value: 'ep_standard', label: ['Episódios padrão • 20–35 min', 'Standard episodes • 20–35 min'], runtime: '20–35 min', factor: 1, schedule: 1 },
  { value: 'ep_long', label: ['Episódios longos • 40–60 min', 'Long episodes • 40–60 min'], runtime: '40–60 min', factor: 1.42, schedule: 1.12 },
];

export const VISUAL_STYLES: { value: string; label: Pair }[] = [
  { value: 'cinematic', label: ['Cinematográfico', 'Cinematic'] },
  { value: 'broadcast', label: ['Televisivo clássico', 'Classic broadcast'] },
  { value: 'documentary', label: ['Documental', 'Documentary'] },
  { value: 'animation2d', label: ['Animação 2D', '2D animation'] },
  { value: 'animation3d', label: ['Animação 3D', '3D animation'] },
  { value: 'anime', label: ['Anime', 'Anime'] },
  { value: 'stylized', label: ['Estilizado/autoral', 'Stylised/auteur'] },
  { value: 'hybrid', label: ['Híbrido', 'Hybrid'] },
];

export const BUDGET_OPTIONS: { value: number; label: Pair }[] = [
  { value: 2.5, label: ['Independente (US$ 2,5 mi)', 'Independent (US$ 2.5M)'] },
  { value: 6, label: ['Médio orçamento (US$ 6 mi)', 'Mid-budget (US$ 6M)'] },
  { value: 12, label: ['Alto orçamento (US$ 12 mi)', 'High budget (US$ 12M)'] },
  { value: 35, label: ['Blockbuster (US$ 35 mi)', 'Blockbuster (US$ 35M)'] },
];

export const BUDGET_TIER_LABELS: Record<BudgetTier, Pair> = {
  indie: ['Independente', 'Independent'],
  medium: ['Médio orçamento', 'Mid-budget'],
  high: ['Alto orçamento', 'High budget'],
  blockbuster: ['Blockbuster', 'Blockbuster'],
};

export const MKT_OPTIONS: { value: number; label: Pair }[] = [
  { value: 0.5, label: ['Orgânica (US$ 0,5 mi)', 'Organic (US$ 0.5M)'] },
  { value: 1.5, label: ['Nacional (US$ 1,5 mi)', 'National (US$ 1.5M)'] },
  { value: 3.5, label: ['Global (US$ 3,5 mi)', 'Global (US$ 3.5M)'] },
];

export const RATINGS: { value: string; label: Pair }[] = [
  { value: 'Livre', label: ['Livre', 'All ages'] },
  { value: '10 anos', label: ['10 anos', '10+'] },
  { value: '12 anos', label: ['12 anos', '12+'] },
  { value: '14 anos', label: ['14 anos', '14+'] },
  { value: '16 anos', label: ['16 anos', '16+'] },
  { value: '18 anos', label: ['18 anos', '18+'] },
];

export const SCRIPT_OPTIONS: { value: string; label: Pair; bonus: number }[] = [
  { value: 'outline', label: ['Argumento + escaleta', 'Treatment + outline'], bonus: 0 },
  { value: 'screenplay', label: ['Roteiro completo', 'Full screenplay'], bonus: 5 },
  { value: 'room', label: ['Sala de roteiro por episódio', 'Episode-based writers’ room'], bonus: 4 },
  { value: 'adapt', label: ['Adaptação com consultoria da obra', 'Adaptation with source consultancy'], bonus: 6 },
];

export const CREW_ROLES: CrewRole[] = ['writer', 'producer', 'cinematography', 'editor', 'composer', 'animation'];

/** Rótulos gravados nos projetos (em português, usados pelo relatório técnico). */
export const CREW_LABELS: Record<CrewRole, Pair> = {
  writer: ['Roteirista', 'Writer'],
  producer: ['Produtor', 'Producer'],
  cinematography: ['Direção de fotografia/visual', 'Cinematography / visuals'],
  editor: ['Montagem', 'Editing'],
  composer: ['Composição musical', 'Music composition'],
  animation: ['Direção de animação/VFX', 'Animation / VFX direction'],
};

/** Rótulos dos campos de equipe no formulário de aprovação. */
export const CREW_FIELD_LABELS: Record<CrewRole, Pair> = {
  writer: ['Roteirista principal', 'Lead writer'],
  producer: ['Produtor', 'Producer'],
  cinematography: ['Diretor de fotografia / visual', 'Cinematographer / visuals'],
  editor: ['Montador', 'Editor'],
  composer: ['Compositor', 'Composer'],
  animation: ['Diretor de animação / VFX', 'Animation / VFX director'],
};

export const RISK_LABELS: Record<string, Pair> = {
  baixo: ['baixo', 'low'],
  moderado: ['moderado', 'moderate'],
  alto: ['alto', 'high'],
};

export const SEASON_EVENTS = [
  { week: 1, name: 'Temporada de premiações', nameEn: 'Awards season', effect: 'Aumenta o custo de campanha de consideração e a visibilidade de títulos elegíveis.', effectEn: 'Raises the cost of consideration campaigns and the visibility of eligible titles.' },
  { week: 14, name: 'Férias e blockbusters de verão', nameEn: 'Summer holidays & blockbusters', effect: 'Ação, aventura e animação familiar disputam telas e atenção.', effectEn: 'Action, adventure and family animation compete for screens and attention.' },
  { week: 27, name: 'Temporada de festivais', nameEn: 'Festival season', effect: 'Drama, documentário e cinema autoral ganham exposição.', effectEn: 'Drama, documentary and auteur cinema gain exposure.' },
  { week: 40, name: 'Janela de terror e suspense', nameEn: 'Horror & thriller window', effect: 'Terror, thriller e mistério recebem impulso de demanda.', effectEn: 'Horror, thriller and mystery get a demand boost.' },
  { week: 48, name: 'Festas de fim de ano', nameEn: 'Year-end holidays', effect: 'Animação familiar, fantasia e comédia podem crescer; custos de mídia sobem.', effectEn: 'Family animation, fantasy and comedy may grow; media costs rise.' },
];

export const DIFFICULTY_OPTIONS: { value: 'standard' | 'indie' | 'tycoon'; label: Pair }[] = [
  { value: 'standard', label: ['Produtor de Primeira Viagem (US$ 20 mi • caos administrável)', 'First-Time Producer (US$ 20M • manageable chaos)'] },
  { value: 'indie', label: ['Fudido, Pé-Rapado & Ambicioso (US$ 20 mi • sofrimento premium)', 'Broke, Scrappy & Ambitious (US$ 20M • premium suffering)'] },
  { value: 'tycoon', label: ['Magnata de Chinelo (US$ 20 mi • vida mansa)', 'Flip-Flop Mogul (US$ 20M • easygoing mode)'] },
];
