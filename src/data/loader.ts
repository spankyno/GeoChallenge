/**
 * Cargador centralizado de datos geográficos.
 * Los archivos viven en public/data/ (servidos estáticamente por Vite).
 * Fácil de ampliar: añade la ruta en THEME_FILES y el mapping en adapter.ts.
 */

import type { ThemeId, GeoEntity } from '../types/geo';
import { loadThemeData, mergeEntities } from './adapter';
import { getMockEntities } from './mockData';

/** Rutas relativas a public/ de los GeoJSON de Natural Earth 50m */
export const THEME_FILES: Partial<Record<ThemeId, string[]>> = {
  countries: ['/data/ne_50m_admin_0_countries.geojson'],
  capitals: ['/data/ne_50m_populated_places.geojson'],
  rivers: ['/data/ne_50m_rivers_lake_centerlines.geojson'],
  // 10m: cobertura mundial (50m solo tenía ~9 países)
  provinces: ['/data/ne_10m_admin_1_states_provinces.geojson'],
  // Solo polígonos (desiertos, islas, mesetas…) + montañas (puntos de elevación)
  geo_features: [
    '/data/ne_50m_geography_regions_polys.geojson',
    '/data/ne_50m_geography_regions_elevation_points.geojson',
  ],
};

/**
 * Carga las entidades de una o varias temáticas.
 * - Si el archivo existe → datos reales normalizados.
 * - Si falla o no hay archivo → fallback a mocks (para desarrollo offline).
 */
export async function loadEntitiesForThemes(themes: ThemeId[]): Promise<GeoEntity[]> {
  const results: GeoEntity[][] = [];

  for (const theme of themes) {
    const urls = THEME_FILES[theme];
    if (!urls || urls.length === 0) {
      // Sin archivo real aún → mock
      results.push(getMockEntities(theme));
      continue;
    }

    let loaded: GeoEntity[] = [];
    for (const url of urls) {
      try {
        const entities = await loadThemeData(theme, url);
        loaded = mergeEntities(loaded, entities);
      } catch (err) {
        console.warn(`[GeoChallenge] No se pudo cargar ${url}:`, err);
      }
    }

    if (loaded.length === 0) {
      console.warn(`[GeoChallenge] Usando mocks para temática "${theme}"`);
      loaded = getMockEntities(theme);
    }

    results.push(loaded);
  }

  return mergeEntities(...results);
}

/** Utilidad: cuenta de entidades por tema (para UI / debug) */
export async function getThemeStats(themes: ThemeId[]): Promise<Record<string, number>> {
  const entities = await loadEntitiesForThemes(themes);
  const stats: Record<string, number> = {};
  for (const e of entities) {
    stats[e.theme] = (stats[e.theme] ?? 0) + 1;
  }
  return stats;
}
