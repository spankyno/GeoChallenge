import { useState, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { MapView } from './components/MapView';
import { SetupPanel } from './components/SetupPanel';
import { QuestionPanel } from './components/QuestionPanel';
import { SummaryPanel } from './components/SummaryPanel';
import { AuthBar, AuthBarDisabled } from './components/AuthBar';
import type { GameConfig, Question, AnswerResult, GameScore, GeoEntity } from './types/geo';
import {
  createInitialScore,
  loadEntitiesForThemes,
  generateQuestions,
  processAnswer,
} from './game/engine';
import {
  canPlayAsAnonymous,
  recordAnonymousPlay,
  getAnonymousPlaysRemaining,
  ANON_DAILY_LIMIT,
} from './lib/playLimit';

type Phase = 'setup' | 'loading' | 'playing' | 'feedback' | 'summary';

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const DEFAULT_CONFIG: GameConfig = {
  themes: ['countries'],
  difficulty: 2,
  questionCount: 5,
  scoreMode: 'precise',
  hintsEnabled: false,
  hintsPerQuestion: 1,
  hintsTotal: 5,
};

export default function App() {
  if (HAS_CLERK) return <AppWithClerk />;
  return <AppCore isSignedIn={false} clerkUserId={null} displayName={null} />;
}

function AppWithClerk() {
  const { isSignedIn, user } = useUser();
  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    null;
  return (
    <AppCore
      isSignedIn={!!isSignedIn}
      clerkUserId={user?.id ?? null}
      displayName={displayName}
    />
  );
}

interface AppCoreProps {
  isSignedIn: boolean;
  clerkUserId: string | null;
  displayName: string | null;
}

function AppCore({ isSignedIn, clerkUserId, displayName }: AppCoreProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [entities, setEntities] = useState<GeoEntity[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<GameScore>(createInitialScore());
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [clickedLngLat, setClickedLngLat] = useState<[number, number] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(0);
  const [mapResetToken, setMapResetToken] = useState(0);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;

  const startGame = useCallback(async () => {
    setLoadError(null);
    setLimitMsg(null);

    // Límite diario solo para no registrados
    if (!isSignedIn) {
      if (!canPlayAsAnonymous()) {
        setLimitMsg(
          `Has alcanzado el límite de ${ANON_DAILY_LIMIT} partidas diarias como invitado. Regístrate para jugar sin límite.`
        );
        return;
      }
    }

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
      setHintsShown(0);
      setHintsRemaining(config.hintsEnabled ? config.hintsTotal : 0);
      setMapResetToken((n) => n + 1);

      // Consumir cupo anónimo al empezar la partida
      if (!isSignedIn) {
        recordAnonymousPlay();
      }

      setPhase('playing');
    } catch (err) {
      console.error(err);
      setLoadError('Error al cargar los datos geográficos.');
      setPhase('setup');
    }
  }, [config, isSignedIn]);

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (phase !== 'playing' || !currentQuestion) return;

      const { result: res, newScore } = processAnswer(
        currentQuestion,
        lng,
        lat,
        config,
        score,
        hintsShown
      );
      setResult(res);
      setScore(newScore);
      setClickedLngLat([lng, lat]);
      setPhase('feedback');
    },
    [phase, currentQuestion, config, score, hintsShown]
  );

  const handleRevealHint = useCallback(() => {
    if (!config.hintsEnabled || hintsRemaining <= 0) return;
    if (hintsShown >= config.hintsPerQuestion) return;
    setHintsShown((n) => n + 1);
    setHintsRemaining((n) => n - 1);
    setScore((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }));
  }, [config.hintsEnabled, config.hintsPerQuestion, hintsRemaining, hintsShown]);

  const handleNext = useCallback(() => {
    const next = currentIndex + 1;
    if (config.questionCount > 0 && next >= questions.length) {
      setPhase('summary');
      return;
    }
    if (next >= questions.length) {
      const used = new Set(questions.map((q) => q.entity.id));
      const more = generateQuestions(entities, 5, used);
      setQuestions((prev) => [...prev, ...more]);
    }
    setCurrentIndex(next);
    setResult(null);
    setClickedLngLat(null);
    setHintsShown(0);
    setMapResetToken((n) => n + 1);
    setPhase('playing');
  }, [currentIndex, questions, config.questionCount, entities]);

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
    setLimitMsg(null);
    setHintsShown(0);
  }, []);

  const mapEntities = useMemo(() => {
    if (!currentQuestion) return [];
    return entities.filter((e) => e.theme === currentQuestion.entity.theme);
  }, [entities, currentQuestion]);

  const isGamePanel = phase === 'playing' || phase === 'feedback';

  return (
    <div className="h-full w-full relative bg-slate-100">
      <div className="absolute inset-0">
        <MapView
          entities={mapEntities}
          highlightedEntity={result?.entity ?? null}
          clickedLngLat={clickedLngLat}
          onMapClick={handleMapClick}
          interactive={phase === 'playing'}
          viewResetKey={mapResetToken}
        />
      </div>

      {HAS_CLERK ? <AuthBar /> : <AuthBarDisabled />}

      <div
        className={`absolute inset-0 pointer-events-none flex p-4 md:p-6 ${
          isGamePanel ? 'items-end justify-start' : 'items-start justify-center'
        }`}
      >
        <div className="pointer-events-auto">
          {phase === 'setup' && (
            <div className="space-y-3">
              <SetupPanel config={config} onChange={setConfig} onStart={startGame} />
              {!isSignedIn && (
                <p className="text-xs text-slate-500 text-center max-w-md">
                  Invitado: {getAnonymousPlaysRemaining()}/{ANON_DAILY_LIMIT} partidas
                  restantes hoy. Regístrate para jugar sin límite.
                </p>
              )}
              {limitMsg && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg p-3 max-w-md">
                  {limitMsg}
                </div>
              )}
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
            </div>
          )}

          {isGamePanel && (
            <QuestionPanel
              question={currentQuestion}
              result={result}
              score={score}
              config={config}
              questionIndex={currentIndex}
              totalQuestions={config.questionCount}
              hintsShown={hintsShown}
              hintsRemaining={hintsRemaining}
              onRevealHint={handleRevealHint}
              onNext={handleNext}
              onQuit={handleQuit}
            />
          )}

          {phase === 'summary' && (
            <SummaryPanel
              score={score}
              config={config}
              isSignedIn={isSignedIn}
              clerkUserId={clerkUserId}
              defaultDisplayName={displayName}
              onRestart={handleRestart}
              onNewConfig={handleNewConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}
