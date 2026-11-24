/**
 * Datos mock mínimos para que la app sea jugable desde el primer momento.
 * Se sustituirán por los JSON reales de Natural Earth 50m (public/data/).
 */

import type { GeoEntity } from '../types/geo';
import type { FeatureCollection } from 'geojson';

/** Países de ejemplo (polígonos simplificados) */
export const MOCK_COUNTRIES: GeoEntity[] = [
  {
    id: 'countries-ES',
    name: 'España',
    nameAlt: 'Spain',
    theme: 'countries',
    subtype: 'Sovereign country',
    code: 'ES',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-9.3, 35.9], [-5.6, 36.0], [-1.8, 37.2], [0.3, 40.5],
          [3.3, 42.3], [-1.8, 43.4], [-7.0, 43.7], [-9.3, 42.9],
          [-9.3, 35.9],
        ],
      ],
    },
  },
  {
    id: 'countries-FR',
    name: 'Francia',
    nameAlt: 'France',
    theme: 'countries',
    subtype: 'Sovereign country',
    code: 'FR',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-5.0, 48.5], [-1.5, 49.5], [2.5, 51.0], [8.2, 49.0],
          [7.5, 47.5], [7.0, 43.5], [3.0, 42.5], [-1.5, 43.3],
          [-5.0, 48.5],
        ],
      ],
    },
  },
  {
    id: 'countries-PT',
    name: 'Portugal',
    nameAlt: 'Portugal',
    theme: 'countries',
    subtype: 'Sovereign country',
    code: 'PT',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-9.5, 36.9], [-7.4, 37.0], [-6.2, 41.5], [-8.7, 42.1],
          [-9.5, 36.9],
        ],
      ],
    },
  },
  {
    id: 'countries-IT',
    name: 'Italia',
    nameAlt: 'Italy',
    theme: 'countries',
    subtype: 'Sovereign country',
    code: 'IT',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [6.6, 44.0], [8.5, 45.5], [12.5, 45.5], [13.5, 42.0],
          [15.5, 38.0], [12.5, 36.5], [10.0, 38.0], [8.0, 39.0],
          [7.5, 43.5], [6.6, 44.0],
        ],
      ],
    },
  },
  {
    id: 'countries-DE',
    name: 'Alemania',
    nameAlt: 'Germany',
    theme: 'countries',
    subtype: 'Sovereign country',
    code: 'DE',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [5.8, 47.5], [7.5, 53.5], [14.0, 54.0], [15.0, 51.0],
          [13.0, 48.5], [10.0, 47.3], [5.8, 47.5],
        ],
      ],
    },
  },
];

/** Capitales de ejemplo (puntos) */
export const MOCK_CAPITALS: GeoEntity[] = [
  {
    id: 'capitals-Madrid',
    name: 'Madrid',
    theme: 'capitals',
    subtype: 'Admin-0 capital',
    code: 'ES',
    geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] },
  },
  {
    id: 'capitals-Paris',
    name: 'París',
    nameAlt: 'Paris',
    theme: 'capitals',
    subtype: 'Admin-0 capital',
    code: 'FR',
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  },
  {
    id: 'capitals-Lisboa',
    name: 'Lisboa',
    nameAlt: 'Lisbon',
    theme: 'capitals',
    subtype: 'Admin-0 capital',
    code: 'PT',
    geometry: { type: 'Point', coordinates: [-9.1393, 38.7223] },
  },
  {
    id: 'capitals-Roma',
    name: 'Roma',
    nameAlt: 'Rome',
    theme: 'capitals',
    subtype: 'Admin-0 capital',
    code: 'IT',
    geometry: { type: 'Point', coordinates: [12.4964, 41.9028] },
  },
  {
    id: 'capitals-Berlin',
    name: 'Berlín',
    nameAlt: 'Berlin',
    theme: 'capitals',
    subtype: 'Admin-0 capital',
    code: 'DE',
    geometry: { type: 'Point', coordinates: [13.4050, 52.5200] },
  },
];

/** Ríos de ejemplo (líneas simplificadas) */
export const MOCK_RIVERS: GeoEntity[] = [
  {
    id: 'rivers-Tajo',
    name: 'Tajo',
    nameAlt: 'Tagus',
    theme: 'rivers',
    subtype: 'River',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-7.0, 40.0], [-6.0, 39.5], [-5.0, 39.8], [-4.0, 39.9],
        [-3.0, 40.0], [-2.0, 39.5],
      ],
    },
  },
  {
    id: 'rivers-Sena',
    name: 'Sena',
    nameAlt: 'Seine',
    theme: 'rivers',
    subtype: 'River',
    geometry: {
      type: 'LineString',
      coordinates: [
        [2.0, 48.0], [2.3, 48.5], [2.5, 49.0], [3.0, 49.2],
      ],
    },
  },
  {
    id: 'rivers-Rin',
    name: 'Rin',
    nameAlt: 'Rhine',
    theme: 'rivers',
    subtype: 'River',
    geometry: {
      type: 'LineString',
      coordinates: [
        [7.5, 47.5], [7.6, 48.5], [7.8, 50.0], [8.5, 51.0], [6.5, 52.0],
      ],
    },
  },
];

/** Provincias de ejemplo (España) */
export const MOCK_PROVINCES: GeoEntity[] = [
  {
    id: 'provinces-Madrid',
    name: 'Madrid',
    theme: 'provinces',
    subtype: 'Province',
    code: 'ES-MD',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-4.5, 40.0], [-3.2, 40.0], [-3.2, 41.0], [-4.5, 41.0], [-4.5, 40.0],
        ],
      ],
    },
  },
  {
    id: 'provinces-Barcelona',
    name: 'Barcelona',
    theme: 'provinces',
    subtype: 'Province',
    code: 'ES-B',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [1.5, 41.2], [2.8, 41.2], [2.8, 42.3], [1.5, 42.3], [1.5, 41.2],
        ],
      ],
    },
  },
];

/** Accidentes geográficos de ejemplo */
export const MOCK_GEO_FEATURES: GeoEntity[] = [
  {
    id: 'geo-Teide',
    name: 'Teide',
    theme: 'geo_features',
    subtype: 'Peak',
    geometry: { type: 'Point', coordinates: [-16.642, 28.272] },
  },
  {
    id: 'geo-Gibraltar',
    name: 'Estrecho de Gibraltar',
    theme: 'geo_features',
    subtype: 'Strait',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-5.8, 35.9], [-5.3, 35.9], [-5.3, 36.2], [-5.8, 36.2], [-5.8, 35.9],
        ],
      ],
    },
  },
];

/** Devuelve los mocks según la temática */
export function getMockEntities(theme: ThemeIdLike): GeoEntity[] {
  switch (theme) {
    case 'countries':
      return MOCK_COUNTRIES;
    case 'capitals':
      return MOCK_CAPITALS;
    case 'rivers':
      return MOCK_RIVERS;
    case 'provinces':
      return MOCK_PROVINCES;
    case 'geo_features':
      return MOCK_GEO_FEATURES;
    default:
      return [];
  }
}

type ThemeIdLike = 'countries' | 'capitals' | 'provinces' | 'rivers' | 'geo_features';

/** FeatureCollection mock (útil para pruebas de capas del mapa) */
export function toFeatureCollection(entities: GeoEntity[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: entities.map((e) => ({
      type: 'Feature',
      id: e.id,
      properties: {
        name: e.name,
        theme: e.theme,
        subtype: e.subtype,
        code: e.code,
      },
      geometry: e.geometry,
    })),
  };
}
