/* 2.0.4.1 — radar consultivo de sinergia temática (não altera resultados) */
import { tr } from '../i18n';

const GENRE_TAGS: Record<string, string[]> = {
  'ação': ['action', 'adventure', 'crime', 'thriller', 'war', 'survival', 'heroic'],
  'aventura': ['adventure', 'action', 'fantasy', 'exploration', 'survival'],
  'drama': ['drama', 'relationship', 'identity', 'family', 'social', 'history'],
  'comédia': ['comedy', 'satire', 'relationship', 'chaos'],
  'comédia romântica': ['comedy', 'romance', 'relationship'],
  'terror': ['horror', 'supernatural', 'psychological', 'mystery'],
  'terror psicológico': ['horror', 'psychological', 'mystery'],
  'suspense': ['thriller', 'mystery', 'crime', 'psychological'],
  'thriller': ['thriller', 'crime', 'mystery', 'action'],
  'mistério': ['mystery', 'crime', 'psychological', 'supernatural'],
  'crime': ['crime', 'thriller', 'action', 'justice'],
  'policial': ['crime', 'thriller', 'justice'],
  'ficção científica': ['scifi', 'technology', 'future', 'space', 'dystopia'],
  'space opera': ['scifi', 'space', 'adventure', 'epic'],
  'cyberpunk': ['scifi', 'technology', 'dystopia', 'crime', 'social'],
  'fantasia': ['fantasy', 'myth', 'adventure', 'epic'],
  'fantasia urbana': ['fantasy', 'urban', 'supernatural'],
  'fantasia épica': ['fantasy', 'myth', 'epic', 'adventure'],
  'distopia': ['dystopia', 'scifi', 'social', 'political'],
  'utopia': ['utopia', 'social', 'scifi'],
  'romance': ['romance', 'relationship', 'drama'],
  'melodrama': ['drama', 'relationship', 'family'],
  'histórico': ['history', 'political', 'war', 'family'],
  'épico': ['epic', 'history', 'war', 'adventure'],
  'guerra': ['war', 'action', 'history', 'political'],
  'faroeste': ['western', 'action', 'crime', 'survival'],
  'musical': ['music', 'romance', 'comedy', 'drama'],
  'biografia': ['biography', 'history', 'drama'],
  'documentário': ['documentary', 'history', 'social', 'science'],
  'mockumentary': ['documentary', 'comedy', 'satire'],
  'animação infantil': ['animation', 'adventure', 'comedy', 'family', 'fantasy'],
  'animação adulta': ['animation', 'drama', 'satire', 'scifi'],
  'anime de ação': ['animation', 'action', 'adventure', 'fantasy'],
  'slice of life': ['daily', 'relationship', 'drama', 'comedy'],
  'esporte': ['sports', 'drama', 'competition', 'underdog'],
  'artes marciais': ['action', 'sports', 'discipline'],
  'super-herói': ['heroic', 'action', 'scifi', 'fantasy'],
  'sobrenatural': ['supernatural', 'horror', 'mystery', 'fantasy'],
  'folk horror': ['horror', 'supernatural', 'rural', 'myth'],
  'gótico': ['horror', 'mystery', 'romance', 'history'],
  'noir': ['crime', 'mystery', 'psychological'],
  'neo-noir': ['crime', 'mystery', 'psychological', 'urban'],
  'coming-of-age': ['coming', 'identity', 'family', 'relationship'],
  'sobrevivência': ['survival', 'action', 'adventure', 'thriller'],
  'experimental': ['experimental', 'art', 'psychological', 'documentary'],
};

const THEME_RULES: [RegExp, string[]][] = [
  [/cyberpunk|artificial intelligence|robot|virtual reality|digital|technological|human enhancement|genetic|mutant|scientific|medical/i, ['scifi', 'technology', 'future']],
  [/time travel|time loop|time paradox|alternate history|parallel worlds/i, ['scifi', 'time', 'mystery']],
  [/family|sibling|parenthood|generational|found family|family legacy/i, ['family', 'relationship', 'drama']],
  [/love|friendship|identity|coming of age|immigration|cultural clash/i, ['relationship', 'identity', 'drama']],
  [/revenge|heist|conspiracy|espionage|undercover|secret society|betrayal|hidden identity|political intrigue|corruption/i, ['crime', 'thriller', 'mystery', 'action']],
  [/dystopia|rebellion|class divide|corporate greed|social|climate|collapse|post-apocalypse|rise and fall/i, ['dystopia', 'social', 'political', 'scifi']],
  [/space|alien|interstellar|first contact|lost civilization/i, ['space', 'scifi', 'adventure']],
  [/prophecy|mythic|chosen one|ancient|quest|cursed|occult|haunted|monster|supernatural/i, ['fantasy', 'myth', 'supernatural', 'horror']],
  [/survival|wilderness|oceanic|arctic|desert|island|escape|road trip|treasure/i, ['survival', 'adventure', 'action']],
  [/sports|underdog|rivalry/i, ['sports', 'competition', 'drama']],
  [/showbiz|workplace|satire|chaos/i, ['comedy', 'satire', 'drama']],
  [/rural|small-town|urban alienation/i, ['urban', 'rural', 'mystery', 'drama']],
  [/legal justice|moral dilemma|ethical experiment/i, ['justice', 'drama', 'mystery']],
  [/documentary|scientific discovery/i, ['documentary', 'science', 'drama']],
];

const tagsGenre = (g: string) => GENRE_TAGS[(g || '').toLowerCase()] || ['drama'];
function tagsTheme(t: string) {
  for (const [re, tags] of THEME_RULES) if (re.test(t || '')) return tags;
  return ['drama', 'identity'];
}
function tagsVision(v: string) {
  const x = (v || '').toLowerCase();
  if (/épico|epic/.test(x)) return ['epic', 'adventure', 'history', 'action'];
  if (/intimista/.test(x)) return ['drama', 'relationship', 'identity', 'family'];
  if (/minimalista/.test(x)) return ['drama', 'psychological', 'identity'];
  if (/estilizado/.test(x)) return ['art', 'action', 'fantasy', 'noir'];
  if (/procedural/.test(x)) return ['crime', 'science', 'justice', 'mystery'];
  if (/antológico/.test(x)) return ['experimental', 'drama', 'documentary'];
  if (/road movie/.test(x)) return ['adventure', 'survival', 'relationship'];
  if (/musical/.test(x)) return ['music', 'comedy', 'romance', 'drama'];
  if (/documental/.test(x)) return ['documentary', 'history', 'social', 'science'];
  return ['drama', 'relationship'];
}

type PairKind = 'genre-theme' | 'genre-genre' | 'genre-vision';

function pairScore(a: string[], b: string[], kind: PairKind): number {
  const A = new Set(a);
  const B = new Set(b);
  const overlap = [...A].filter((x) => B.has(x)).length;
  let score = overlap ? Math.min(96, 76 + overlap * 8) : 48;
  const has = (x: string, y: string) => (A.has(x) && B.has(y)) || (A.has(y) && B.has(x));
  if (has('action', 'adventure')) score = 100;
  if (has('horror', 'comedy')) score = 16;
  if (has('horror', 'romance') && !overlap) score = 38;
  if (has('comedy', 'war') && !overlap) score = 42;
  if (has('scifi', 'technology')) score = Math.max(score, 94);
  if (has('crime', 'thriller')) score = Math.max(score, 94);
  if (has('fantasy', 'myth')) score = Math.max(score, 94);
  if (kind === 'genre-theme' && overlap === 0) score = Math.min(score, 58);
  if (kind === 'genre-vision' && overlap === 0) score = Math.min(score, 55);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface SynergyLevel {
  bg: string;
  fg: string;
  label: string;
}

export function synergyLevel(n: number): SynergyLevel {
  if (n >= 85) return { bg: '#dff3df', fg: '#176b2c', label: tr('ÓTIMA', 'GREAT') };
  if (n >= 70) return { bg: '#dcecff', fg: '#1557a6', label: tr('BOA', 'GOOD') };
  if (n >= 45) return { bg: '#fff0d9', fg: '#995500', label: tr('MEDIANA', 'AVERAGE') };
  return { bg: '#ffe0e0', fg: '#a40018', label: tr('FALÊNCIA CRIATIVA', 'CREATIVE BANKRUPTCY') };
}

export interface SynergyChip {
  label: string;
  score: number;
}

export function computeSynergy(genre: string, theme: string, secondary: string, filmType: string): SynergyChip[] {
  const vision = filmType.includes('—') ? filmType.split('—').slice(1).join('—').trim() : 'realista';
  const gt = tagsGenre(genre);
  const tt = tagsTheme(theme);
  const vt = tagsVision(vision);
  const out: SynergyChip[] = [{ label: tr('Gênero × tema', 'Genre × theme'), score: pairScore(gt, tt, 'genre-theme') }];
  if (secondary && secondary !== 'none') {
    const g2 = tagsGenre(secondary);
    out.push({ label: tr('Gênero × segundo gênero', 'Genre × second genre'), score: pairScore(gt, g2, 'genre-genre') });
    out.push({ label: tr('Segundo gênero × tema', 'Second genre × theme'), score: pairScore(g2, tt, 'genre-theme') });
    out.push({ label: tr('Gênero × visão criativa', 'Genre × creative vision'), score: pairScore(gt, vt, 'genre-vision') });
    out.push({ label: tr('Segundo gênero × visão', 'Second genre × vision'), score: pairScore(g2, vt, 'genre-vision') });
  } else {
    out.push({ label: tr('Gênero × visão criativa', 'Genre × creative vision'), score: pairScore(gt, vt, 'genre-vision') });
  }
  return out;
}
