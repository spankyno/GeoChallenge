import { useState, useCallback, useMemo } from 'react';
import { MapView } from './components/MapView';
import { SetupPanel } from './components/SetupPanel';
import { QuestionPanel } from './components/QuestionPanel';
import { SummaryPanel } from './components/SummaryPanel';
import type { GameConfig, Question, AnswerResult, GameScore, GeoEntity } from './types/geo';
import {
  createInitialScore,
  loadEntitiesForThemes,
  generateQuestions,
  processAnswer,
} from './game/engine';

type Phase = 'setup' | 'loading' | 'playing' | 'feedback' | 'summary';

const DEFAULT_CONFIG: GameConfig = {
  themes: ['countries'],
  difficulty: 2,
  questionCount: 5,
};

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [entities, setEntities] = useState<GeoEntity[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<GameScore>(createInitialScore());
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [clickedLngLat, setClickedLngLat] = useState<[number, number] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;

  const startGame = useCallback(async () => {
    setLoadError(null);
    setPhase('loading');

    try {
      const loaded = await loadEntitiesForThemes(config.themes);
      if (loaded.length === 0) {
        setLoadError('No se encontraron entidades para las temáticas seleccionadas.');
        setPhase('setup');
        return;
      }
      const qs = generateQuestions(loaded, config.questionCount);
      setEntities(loaded);
      setQuestions(qs);
      setCurrentIndex(0);
      setScore(createInitialScore());
      setResult(null);
      setClickedLngLat(null);
      setPhase('playing');
    } catch (err) {
      console.error(err);
      setLoadError('Error al cargar los datos geográficos.');
      setPhase('setup');
    }
  }, [config]);

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (phase !== 'playing' || !currentQuestion) return;

      const { result: res, newScore } = processAnswer(
        currentQuestion,
        lng,
        lat,
        config,
        score
      );
      setResult(res);
      setScore(newScore);
      setClickedLngLat([lng, lat]);
      setPhase('feedback');
    },
    [phase, currentQuestion, config, score]
  );

  const handleNext = useCallback(() => {
    const next = currentIndex + 1;
    if (config.questionCount > 0 && next >= questions.length) {
      setPhase('summary');
      return;
    }
    if (next >= questions.length) {
      const more = generateQuestions(entities, 5);
      setQuestions((prev) => [...prev, ...more]);
    }
    setCurrentIndex(next);
    setResult(null);
    setClickedLngLat(null);
    setPhase('playing');
  }, [currentIndex, questions.length, config.questionCount, entities]);

  const handleQuit = useCallback(() => {
    setPhase('summary');
  }, []);

  const handleRestart = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleNewConfig = useCallback(() => {
    setPhase('setup');
    setResult(null);
    setClickedLngLat(null);
    setLoadError(null);
  }, []);

  const mapEntities = useMemo(() => entities, [entities]);

  return (
    <div className="h-full w-full relative bg-slate-100">
      <div className="absolute inset-0">
        <MapView
          entities={mapEntities}
          highlightedEntity={result?.entity ?? null}
          clickedLngLat={clickedLngLat}
          onMapClick={handleMapClick}
          interactive={phase === 'playing'}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none flex items-start justify-center p-4 md:p-6">
        <div className="pointer-events-auto">
          {phase === 'setup' && (
            <div className="space-y-3">
              <SetupPanel config={config} onChange={setConfig} onStart={startGame} />
              {loadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 max-w-md">
                  {loadError}
                </div>
              )}
            </div>
          )}

          {phase === 'loading' && (
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-6 max-w-sm text-center">
              <div className="animate-pulse text-slate-600 font-medium">
                Cargando datos geográficos…
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Países y capitales de Natural Earth 50m
              </p>
            </div>
          )}

          {(phase === 'playing' || phase === 'feedback') && (
            <div className="mt-2">
              <QuestionPanel
                question={currentQuestion}
                result={result}
                score={score}
                questionIndex={currentIndex}
                totalQuestions={config.questionCount}
                onNext={handleNext}
                onQuit={handleQuit}
              />
            </div>
          )}

          {phase === 'summary' && (
            <SummaryPanel
              score={score}
              onRestart={handleRestart}
              onNewConfig={handleNewConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}
