import { THEMES, type ThemeId, type GameConfig, type ScoreMode } from '../types/geo';

interface SetupPanelProps {
  config: GameConfig;
  onChange: (cfg: GameConfig) => void;
  onStart: () => void;
}

export function SetupPanel({ config, onChange, onStart }: SetupPanelProps) {
  const toggleTheme = (id: ThemeId) => {
    const themes = config.themes.includes(id)
      ? config.themes.filter((t) => t !== id)
      : [...config.themes, id];
    onChange({ ...config, themes });
  };

  const canStart = config.themes.length > 0;

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 max-w-md w-full space-y-5 max-h-[90vh] overflow-y-auto custom-scroll">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">GeoChallenge</h1>
        <p className="text-slate-500 text-sm mt-1">
          Elige temáticas, modo de juego y opciones, luego señala el lugar en el mapa.
        </p>
      </div>

      {/* Temáticas */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Temáticas
        </h2>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => {
            const t = THEMES[id];
            const selected = config.themes.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleTheme(id)}
                className={`flex items-start gap-3 p-2.5 rounded-lg border text-left transition ${
                  selected
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 ${
                    selected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                  }`}
                />
                <div>
                  <div className="font-medium text-slate-800 text-sm">{t.label}</div>
                  <div className="text-xs text-slate-500">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modo de puntuación */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Modo de juego
        </h2>
        <div className="flex gap-2">
          {(
            [
              {
                id: 'precise' as ScoreMode,
                label: 'Preciso',
                desc: 'Acierto solo si clicas muy cerca',
              },
              {
                id: 'distance' as ScoreMode,
                label: 'Distancia',
                desc: 'Más puntos cuanto más cerca',
              },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ ...config, scoreMode: m.id })}
              className={`flex-1 p-2.5 rounded-lg border text-left transition ${
                config.scoreMode === m.id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="font-medium text-slate-800 text-sm">{m.label}</div>
              <div className="text-xs text-slate-500">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dificultad */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Dificultad: {config.difficulty}
        </h2>
        <input
          type="range"
          min={1}
          max={5}
          value={config.difficulty}
          onChange={(e) =>
            onChange({ ...config, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
          }
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Fácil</span>
          <span>Difícil</span>
        </div>
      </div>

      {/* Preguntas */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
          Preguntas por ronda
        </h2>
        <div className="flex gap-2 flex-wrap">
          {[5, 10, 15, 0].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...config, questionCount: n })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                config.questionCount === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {n === 0 ? 'Infinito' : n}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canStart}
        onClick={onStart}
        className={`w-full py-3 rounded-lg font-semibold text-white transition ${
          canStart
            ? 'bg-blue-600 hover:bg-blue-700 shadow'
            : 'bg-slate-300 cursor-not-allowed'
        }`}
      >
        Empezar partida
      </button>
    </div>
  );
}
