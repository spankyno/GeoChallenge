import type { Feature, FeatureCollection, Geometry, Point, Polygon, MultiPolygon, LineString, MultiLineString } from 'geojson';

/** Temáticas disponibles en el juego */
export type ThemeId =
  | 'countries'
  | 'capitals'
  | 'provinces'
  | 'rivers'
  | 'geo_features'; // accidentes + montañas

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  description: string;
  geometryTypes: Array<'Polygon' | 'MultiPolygon' | 'Point' | 'LineString' | 'MultiLineString'>;
  /** Radio de tolerancia en km para Point/LineString (ajustable por dificultad) */
  defaultToleranceKm: number;
  /** Color de highlight en el mapa */
  highlightColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  countries: {
    id: 'countries',
    label: 'Países',
    description: 'Localiza países del mundo',
    geometryTypes: ['Polygon', 'MultiPolygon'],
    defaultToleranceKm: 0, // dentro del polígono
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

/** Entidad normalizada del juego (independiente de las propiedades del JSON original) */
export interface GeoEntity {
  id: string;
  name: string;
  theme: ThemeId;
  /** Nombre alternativo o local */
  nameAlt?: string;
  /** Subtipo: "country", "capital", "river", "peak", "gulf", etc. */
  subtype?: string;
  /** Código ISO o identificador externo */
  code?: string;
  geometry: Geometry;
  /** Propiedades originales (para depuración / info extra) */
  rawProperties?: Record<string, unknown>;
}

export type GeoEntityCollection = GeoEntity[];

/** Estado de una partida */
export interface GameConfig {
  themes: ThemeId[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  questionCount: number; // 0 = modo infinito
}

export interface Question {
  id: string;
  entity: GeoEntity;
  prompt: string; // "Señala en el mapa: Francia"
}

export interface AnswerResult {
  correct: boolean;
  distanceKm?: number;
  clickedLngLat: [number, number];
  entity: GeoEntity;
}

export interface GameScore {
  correct: number;
  total: number;
  streak: number;
  maxStreak: number;
  points: number;
}

/** Mapeo configurable de propiedades JSON → campos normalizados */
export interface PropertyMapping {
  /** Campo(s) posibles para el nombre principal */
  nameFields: string[];
  /** Campo(s) para nombre alternativo */
  nameAltFields?: string[];
  /** Campo(s) para código / ISO */
  codeFields?: string[];
  /** Campo(s) para subtipo / featurecla / type */
  subtypeFields?: string[];
  /** Filtro opcional: solo incluir features donde esta propiedad tenga estos valores */
  filter?: { field: string; values: string[] };
}
