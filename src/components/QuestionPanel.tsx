import type { Question, AnswerResult, GameScore, GameConfig } from '../types/geo';
import { THEMES } from '../types/geo';

interface QuestionPanelProps {
  question: Question | null;
  result: AnswerResult | null;
  score: GameScore;
  config: GameConfig;
  questionIndex: number;
  totalQuestions: number;
  hintsShown: number;
  hintsRemaining: number;
  onRevealHint: () => void;
  onNext: () => void;
  onQuit: () => void;
}

export function QuestionPanel({
  question,
  result,
  score,
  config,
  questionIndex,
  totalQuestions,
  hintsShown,
  hintsRemaining,
  onRevealHint,
  onNext,
  onQuit,
}: QuestionPanelProps) {
  if (!question) return null;

  const theme = THEMES[question.entity.theme];
  const canHint =
    config.hintsEnabled &&
    !result &&
    hintsShown < config.hintsPerQuestion &&
    hintsRemaining > 0 &&
    hintsShown < question.hints.length;

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 max-w-sm w-full space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-3">
          <span className="font-semibold text-green-600">✓ {score.correct}</span>
          <span className="text-slate-500">
            {score.total > 0 ? `${Math.round((score.correct / score.total) * 100)}%` : '—'}
          </span>
          <span className="text-amber-600 font-medium">🔥 {score.streak}</span>
        </div>
        <div className="text-slate-600 font-medium">{score.points} pts</div>
      </div>

      <div className="text-xs text-slate-400 flex justify-between">
        <span>
          {totalQuestions > 0
            ? `Pregunta ${questionIndex + 1} / ${totalQuestions}`
            : `Pregunta ${questionIndex + 1}`}
        </span>
        <span>
          {config.scoreMode === 'precise' ? 'Modo preciso' : 'Modo distancia'}
          {config.hintsEnabled && ` · Pistas: ${hintsRemaining}`}
        </span>
      </div>

      {!result && (
        <div className="py-1 space-y-2">
          <p className="text-lg font-semibold text-slate-800 leading-snug">{question.prompt}</p>
          <p className="text-xs text-slate-400">{theme?.label} · Haz clic en el mapa</p>

          {hintsShown > 0 && (
            <ul className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2 space-y-1">
              {question.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i}>💡 {h}</li>
              ))}
            </ul>
          )}

          {canHint && (
            <button
              type="button"
              onClick={onRevealHint}
              className="w-full py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition"
            >
              Usar pista ({hintsRemaining} restantes · máx. {config.hintsPerQuestion}/pregunta)
            </button>
          )}
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-3 ${
            result.correct
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="font-semibold text-lg">
            {result.scoreMode === 'distance'
              ? result.pointsEarned > 0
                ? `+${result.pointsEarned} pts`
                : '0 pts'
              : result.correct
                ? '¡Correcto!'
                : 'Incorrecto'}
            {result.scoreMode === 'precise' && result.correct && result.pointsEarned > 0 && (
              <span className="text-sm font-normal text-slate-600 ml-2">
                +{result.pointsEarned} pts
              </span>
            )}
          </div>
          <div className="text-sm mt-1 text-slate-700">
            <strong>{result.entity.name}</strong>
            {result.entity.subtype && (
              <span className="text-slate-500"> · {result.entity.subtype}</span>
            )}
          </div>
          {result.distanceKm != null && (
            <div className="text-xs text-slate-600 mt-1">
              Distancia: <strong>{result.distanceKm.toFixed(1)} km</strong>
            </div>
          )}
          <button
            type="button"
            onClick={onNext}
            className="mt-3 w-full py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
          >
            Siguiente →
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onQuit}
        className="text-xs text-slate-400 hover:text-slate-600 underline"
      >
        Terminar partida
      </button>
    </div>
  );
}
