import { Meter, ScreenTitle } from '../components/ui';
import { FILM_TYPES, GENRE_45 } from '../game/constants';
import { useGameState } from '../game/store';
import { useLang } from '../i18n';

export function LibraryScreen() {
  const s = useGameState();
  const { tr } = useLang();
  const unlockedGenres = Math.min(GENRE_45.length, s.ext.genreUnlocked);
  const unlockedTypes = s.ext.filmTypesUnlocked;

  return (
    <>
      <ScreenTitle tab="library">📚 {tr('Biblioteca de gêneros, formatos e propriedades intelectuais', 'Genre, format & IP library')}</ScreenTitle>
      <div className="grid-2">
        <div className="card">
          <h3>{tr('Gêneros e subgêneros', 'Genres & subgenres')}</h3>
          <p>
            {tr('45 gêneros e subgêneros cadastrados. Desbloqueados', '45 genres and subgenres on file. Unlocked')}: {unlockedGenres}/45
          </p>
          {GENRE_45.map((g, i) => (
            <div key={g} className={`phase ${i < unlockedGenres ? 'done' : ''}`}>
              {g} {i < unlockedGenres ? '✓' : '🔒'}
            </div>
          ))}
        </div>
        <div className="card">
          <h3>{tr('450 formatos de filme desbloqueáveis', '450 unlockable film formats')}</h3>
          <p>
            {FILM_TYPES.length} {tr('combinações de gênero e abordagem. Desbloqueadas', 'genre and approach combinations. Unlocked')}: {unlockedTypes}/450
          </p>
          <Meter value={(unlockedTypes / 450) * 100} />
          <div className="muted">{tr('Novos gêneros e tipos são liberados a cada novo ano da campanha.', 'New genres and types unlock with each new campaign year.')}</div>
          <div className="phase">
            {tr('Próximo desbloqueio', 'Next unlock')}: {FILM_TYPES[Math.min(449, unlockedTypes)] || tr('Todos liberados', 'All unlocked')}
          </div>
        </div>
      </div>
      <div className="card">
        <h3>{tr('Catálogo de produções originais', 'Original productions catalogue')}</h3>
        <p className="muted">{tr('O estúdio trabalha com obras originais. Não há catálogo de franquias ou propriedades licenciadas nesta edição.', 'The studio works with original productions. No franchise or licensed-property catalogue is included in this edition.')}</p>
      </div>
    </>
  );
}
