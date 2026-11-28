import { useState, useCallback, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { MapView } from './components/MapView';
import { SetupPanel } from './components/SetupPanel';
import { QuestionPanel } from './components/QuestionPanel';
import { SummaryPanel } from './components/SummaryPanel';
import { AuthBar, AuthBarDisabled } from './components/AuthBar';
import { Confetti } from './components/Confetti';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';
import { PrivacyPage } from './components/PrivacyPage';
import type { GameConfig, Question, AnswerResult, GameScore, GeoEntity } from './types/geo';
import {
  createInitialScore,
  loadEntitiesForThemes,
  generateQuestions,
  processAnswer,
} from './game/engine';
import { getEntityCenter } from './game/geometry';
import { ANON_DAILY_LIMIT, getAnonymousPlaysRemaining, recordAnonymousPlay } from './lib/playLimit';
import { reserveAnonymousPlay } from './api/scores';

type Phase = 'setup' | 'loading' | 'playing' | 'feedback' | 'summary';
type Page = 'game' | 'about' | 'privacy';

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const DEFAULT_CONFIG: GameConfig = {
  themes: ['countries'],
  difficulty: 2,
  questionCount: 5,
  scoreMode: 'precise',
};

export default function App() {
  if (HAS_CLERK) return <AppWithClerk />;
  return <AppCore isSignedIn={false} displayName={null} />;
}

function AppWithClerk() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    null;
  return (
    <AppCore
      isSignedIn={!!isSignedIn}
      displayName={displayName}
      getAuthToken={getToken}
    />
  );
}

interface AppCoreProps {
  isSignedIn: boolean;
  displayName: string | null;
  getAuthToken?: () => Promise<string | null>;
}

function AppCore({ isSignedIn, displayName, getAuthToken }: AppCoreProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [entities, setEntities] = useState<GeoEntity[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<GameScore>(createInitialScore());
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [clickedLngLat, setClickedLngLat] = useState<[number, number] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapResetToken, setMapResetToken] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [page, setPage] = useState<Page>('game');
  const [countryOutlines, setCountryOutlines] = useState<GeoEntity[]>([]);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;

  const startGame = useCallback(async () => {
    setLoadError(null);
    setLimitMsg(null);


    setPhase('loading');

    try {
      const loaded = await loadEntitiesForThemes(config.themes);
      if (loaded.length === 0) {
        setLoadError('No se encontraron entidades para las temáticas seleccionadas.');
        setPhase('setup');
        return;
      }
      // Capa auxiliar de países en modo ríos
      if (config.themes.includes('rivers')) {
        try {
          const countries = await loadEntitiesForThemes(['countries']);
          setCountryOutlines(countries);
        } catch {
          setCountryOutlines([]);
        }
      } else {
        setCountryOutlines([]);
      }
      const qs = generateQuestions(loaded, config.questionCount);
      // El límite de invitado se aplica en D1, no en localStorage.
      if (!isSignedIn) {
        const reservation = await reserveAnonymousPlay();
        if (!reservation.allowed) {
          setLimitMsg(reservation.message || `Has alcanzado el límite de ${ANON_DAILY_LIMIT} partidas diarias como invitado. Regístrate para jugar sin límite.`);
          setPhase('setup');
          return;
        }
        // Solo para reflejar el contador visual local; el límite real ya se ha aplicado en D1.
        recordAnonymousPlay();
      }
      setEntities(loaded);
      setQuestions(qs);
      setCurrentIndex(0);
      setScore(createInitialScore());
      setResult(null);
      setClickedLngLat(null);
      setMapResetToken((n) => n + 1);

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
        score
      );
      setResult(res);
      setScore(newScore);
      setClickedLngLat([lng, lat]);
      setShowConfetti(!!res.correct);
      setPhase('feedback');
    },
[phase, currentQuestion, config, score]
  );


  const handleTimeout = useCallback(() => {
    if (phase !== 'playing' || !currentQuestion) return;
    const center = getEntityCenter(currentQuestion.entity.geometry);
    const newScore = {
      ...score,
      total: score.total + 1,
      streak: 0,
      timedOut: true,
    };
    setScore(newScore);
    setResult({
      correct: false,
      pointsEarned: 0,
      clickedLngLat: center,
      entity: currentQuestion.entity,
      scoreMode: config.scoreMode,
    });
    // Marcamos el centro de la respuesta para que el mapa resalte la geometría
    setClickedLngLat(center);
    setShowConfetti(false);
    setPhase('feedback');
  }, [phase, currentQuestion, score, config.scoreMode]);

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
    setShowConfetti(false);
    setMapResetToken((n) => n + 1);
    setPhase('playing');
  }, [currentIndex, questions, config.questionCount, entities]);

  const handleQuit = useCallback(() => {
    setShowConfetti(false);
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
  }, []);

  const mapEntities = useMemo(() => {
    if (!currentQuestion) return [];
    return entities.filter((e) => e.theme === currentQuestion.entity.theme);
  }, [entities, currentQuestion]);

  const isGamePanel = phase === 'playing' || phase === 'feedback';

  if (page === 'about') {
    return (
      <div className="h-full w-full relative">
        <AboutPage onBack={() => setPage('game')} onPrivacy={() => setPage('privacy')} />
      </div>
    );
  }
  if (page === 'privacy') {
    return (
      <div className="h-full w-full relative">
        <PrivacyPage onBack={() => setPage('about')} />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-slate-100 pb-12">
      <div className="absolute inset-0">
        <MapView
          entities={mapEntities}
          highlightedEntity={result?.entity ?? null}
          clickedLngLat={clickedLngLat}
          wasCorrect={result ? result.correct : null}
          countryOutlines={
            currentQuestion?.entity.theme === 'rivers' ? countryOutlines : []
          }
          onMapClick={handleMapClick}
          interactive={phase === 'playing'}
          viewResetKey={mapResetToken}
        />
      </div>

      {HAS_CLERK ? <AuthBar /> : <AuthBarDisabled />}
      <Confetti active={showConfetti} />
      <LeaderboardModal open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <Footer onNavigate={(p) => setPage(p)} />

      <div
        className={`absolute inset-0 pointer-events-none flex p-4 md:p-6 ${
          isGamePanel ? 'items-end justify-start' : 'items-start justify-center'
        }`}
      >
        <div className="pointer-events-auto">
          {phase === 'setup' && (
            <div className="space-y-3">
              <SetupPanel config={config} onChange={setConfig} onStart={startGame} />
              <button
                type="button"
                onClick={() => setShowLeaderboard(true)}
                className="w-full max-w-md py-2 rounded-lg border border-slate-300 bg-white/90 text-slate-700 text-sm font-medium hover:bg-white shadow"
              >
                Ver ranking top 100
              </button>
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
              timerActive={phase === 'playing'}
              onTimeout={handleTimeout}
              onNext={handleNext}
              onQuit={handleQuit}
            />
          )}

          {phase === 'summary' && (
            <SummaryPanel
              score={score}
              config={config}
              isSignedIn={isSignedIn}
              getAuthToken={getAuthToken}
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
