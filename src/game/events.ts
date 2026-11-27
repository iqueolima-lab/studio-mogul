/* Eventos de produção e imprensa (base + textos editoriais 2.0.7) */
import type { GameEvent, Project } from './types';
import { addExpense, pick } from './utils';
import { getLang } from '../i18n';

interface PrEvent {
  pt: [string, string, string[]];
  en: [string, string, string[]];
  choices: { cost: number; buzz: number; qual: number }[];
}

const PR_EVENTS: PrEvent[] = [
  {
    pt: ['Vazamento de páginas: a literatura escapou', 'Três páginas do roteiro apareceram nas redes. O público já debate a reviravolta; o departamento jurídico debate se três páginas constituem literatura ou evidência.', ['Transformar o vazamento em teaser (-US$ 0,15 mi; +8 expectativa)', 'Não alimentar os rumores (US$ 0; +2 expectativa)']],
    en: ['Script pages escape into the wild', 'Three script pages surfaced online. The audience is debating the twist; Legal is debating whether three pages qualify as literature or evidence.', ['Turn the leak into a teaser (-$0.15M; +8 hype)', 'Do not feed the rumours ($0; +2 hype)']],
    choices: [
      { cost: 0.15, buzz: 8, qual: 0 },
      { cost: 0, buzz: 2, qual: 0 },
    ],
  },
  {
    pt: ['Alvará de locação em peregrinação', 'A autorização de filmagem encontrou uma pequena dificuldade burocrática. O documento está em algum lugar entre a prefeitura e uma dimensão administrativa paralela.', ['Pagar hora extra para acelerar (-US$ 0,25 mi; +3 qualidade)', 'Reescrever a cena para o estúdio (US$ 0; -2 qualidade)']],
    en: ['Location permit enters administrative limbo', 'The filming permit has encountered a minor bureaucratic obstacle. The document is somewhere between City Hall and an administrative pocket dimension.', ['Pay overtime to hurry it along (-$0.25M; +3 quality)', 'Rewrite the scene for the soundstage ($0; -2 quality)']],
    choices: [
      { cost: 0.25, buzz: 0, qual: 3 },
      { cost: 0, buzz: 0, qual: -2 },
    ],
  },
  {
    pt: ['Vídeo de bastidores conquista a internet', 'Um erro de gravação viralizou. Pela primeira vez, a produção conseguiu entregar exatamente o que ninguém havia solicitado.', ['Impulsionar o vídeo (-US$ 0,10 mi; +10 expectativa)', 'Deixar o público trabalhar de graça (+5 expectativa)']],
    en: ['Behind-the-scenes clip conquers the internet', 'A blooper went viral. For the first time, production delivered exactly what nobody had requested.', ['Boost the clip (-$0.10M; +10 hype)', 'Let the audience work for free (+5 hype)']],
    choices: [
      { cost: 0.1, buzz: 10, qual: 0 },
      { cost: 0, buzz: 5, qual: 0 },
    ],
  },
];

/** Evento de imprensa de baixo impacto para um projeto em produção. */
export function prEvent(project: Project): GameEvent {
  const ev = pick(PR_EVENTS);
  const [title, desc, labels] = getLang() === 'en' ? ev.en : ev.pt;
  return {
    title: `${title} (${project.title})`,
    desc,
    choices: ev.choices.map((c, i) => ({
      label: labels[i],
      apply: (s) => {
        const p = s.projects.find((x) => x.id === project.id);
        if (!p) return;
        if (c.cost > 0) addExpense(s, c.cost);
        p.buzz = Math.max(0, p.buzz + c.buzz);
        p.quality = Math.max(10, Math.min(100, p.quality + c.qual));
      },
    })),
  };
}
