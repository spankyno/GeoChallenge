import type { Geometry } from 'geojson';

/** Temáticas disponibles en el juego */
export type ThemeId =
  | 'countries'
  | 'capitals'
  | 'provinces'
  | 'rivers'
  | 'geo_features';

/** Modo de evaluación / puntuación */
export type ScoreMode = 'precise' | 'distance';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  description: string;
  geometryTypes: Array<'Polygon' | 'MultiPolygon' | 'Point' | 'LineString' | 'MultiLineString'>;
  /** Radio de tolerancia en km para Point/LineString (modo preciso) */
  defaultToleranceKm: number;
  highlightColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  countries: {
    id: 'countries',
    label: 'Países',
    description: 'Localiza países del mundo',
    geometryTypes: ['Polygon', 'MultiPolygon'],
    defaultToleranceKm: 0,
    highlightColor: '#3b82f6',
  },
  capitals: {
    id: 'capitals',
    label: 'Capitales',
    description: 'Localiza capitales de países',
    geometryTypes: ['Point'],
    defaultToleranceKm: 50,
    highlightColor: '#ef4444',
  },
  provinces: {
    id: 'provinces',
    label: 'Provincias / Estados',
    description: 'Localiza divisiones administrativas de nivel 1',
    geometryTypes: ['Polygon', 'MultiPolygon'],
    defaultToleranceKm: 0,
    highlightColor: '#8b5cf6',
  },
  rivers: {
    id: 'rivers',
    label: 'Ríos',
    description: 'Localiza ríos principales',
    geometryTypes: ['LineString', 'MultiLineString'],
    defaultToleranceKm: 30,
    highlightColor: '#06b6d4',
  },
  geo_features: {
    id: 'geo_features',
    label: 'Accidentes geográficos',
    description: 'Golfos, islas, montañas, desiertos, etc.',
    geometryTypes: ['Polygon', 'MultiPolygon', 'Point'],
    defaultToleranceKm: 40,
    highlightColor: '#f59e0b',
  },
};

export interface GeoEntity {
  id: string;
  name: string;
  theme: ThemeId;
  nameAlt?: string;
  subtype?: string;
  code?: string;
  geometry: Geometry;
  rawProperties?: Record<string, unknown>;
}

export type GeoEntityCollection = GeoEntity[];

export interface GameConfig {
  themes: ThemeId[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  questionCount: number; // 0 = infinito
  /** precise = acierto/fallo por tolerancia; distance = puntos según km */
  scoreMode: ScoreMode;
  /** Activar sistema de pistas */
  hintsEnabled: boolean;
  /** Máximo de pistas usables por pregunta (1–3) */
  hintsPerQuestion: 1 | 2 | 3;
  /** Presupuesto total de pistas en la ronda */
  hintsTotal: number;
}

export interface Question {
  id: string;
  entity: GeoEntity;
  prompt: string;
  /** Pistas pregeneradas (de menos a más reveladoras) */
  hints: string[];
}

export interface AnswerResult {
  correct: boolean;
  distanceKm?: number;
  pointsEarned: number;
  clickedLngLat: [number, number];
  entity: GeoEntity;
  scoreMode: ScoreMode;
}

export interface GameScore {
  correct: number;
  total: number;
  streak: number;
  maxStreak: number;
  points: number;
  hintsUsed: number;
}

/** Fila de ranking (API / D1) */
export interface ScoreRow {
  id?: number;
  created_at: string;
  username: string;
  game_mode: ScoreMode;
  difficulty: number;
  themes: string;
  score: number;
  correct: number;
  total: number;
  hints_used: number;
  clerk_user_id?: string | null;
}

export interface PropertyMapping {
  nameFields: string[];
  nameAltFields?: string[];
  codeFields?: string[];
  subtypeFields?: string[];
  filter?: { field: string; values: string[] };
}
