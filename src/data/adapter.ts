/**
 * Capa de normalización / adaptador de datos GeoJSON.
 * No hardcodeamos nombres de campos: usamos PropertyMapping configurable.
 * Cuando se inspeccionen los JSON reales de Natural Earth se ajustan los mappings.
 */

import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeoEntity, ThemeId, PropertyMapping } from '../types/geo';

/** Mappings por defecto inspirados en Natural Earth 50m (ajustables) */
/**
 * Mappings ajustados tras inspeccionar los GeoJSON reales de Natural Earth 50m
 * (nvkelso/natural-earth-vector). Preferimos NAME_ES cuando existe.
 */
export const DEFAULT_MAPPINGS: Record<ThemeId, PropertyMapping> = {
  countries: {
    // Prefer Spanish name when available
    nameFields: ['NAME_ES', 'NAME', 'ADMIN', 'NAME_LONG', 'name'],
    nameAltFields: ['NAME_EN', 'NAME', 'NAME_ALT'],
    codeFields: ['ISO_A2', 'ISO_A3', 'ADM0_A3'],
    subtypeFields: ['TYPE', 'featurecla'],
  },
  capitals: {
    nameFields: ['NAME_ES', 'NAME', 'NAMEASCII', 'name'],
    nameAltFields: ['NAME', 'NAME_EN'],
    codeFields: ['ADM0_A3', 'ISO_A2'],
    subtypeFields: ['FEATURECLA', 'featurecla'],
    // Solo capitales nacionales (inspeccionado: 202 + 13 alt)
    filter: { field: 'FEATURECLA', values: ['Admin-0 capital', 'Admin-0 capital alt'] },
  },
  provinces: {
    nameFields: ['NAME_ES', 'name', 'NAME', 'NAME_1'],
    nameAltFields: ['NAME_EN', 'name_alt'],
    codeFields: ['iso_3166_2', 'ISO_3166_2', 'ADM1_CODE'],
    subtypeFields: ['type', 'TYPE', 'featurecla'],
  },
  rivers: {
    // Natural Earth 50m rivers: campos en minúsculas
    nameFields: ['name', 'NAME', 'name_en', 'NAME_ES'],
    nameAltFields: ['name_en', 'name_alt', 'NAME_ALT'],
    subtypeFields: ['featurecla', 'FEATURECLA'],
    // Solo ríos (excluir "Lake Centerline")
    filter: { field: 'featurecla', values: ['River'] },
  },
  geo_features: {
    nameFields: ['name', 'NAME', 'NAME_ES'],
    nameAltFields: ['name_alt', 'NAME_ALT'],
    subtypeFields: ['featurecla', 'FEATURECLA', 'type', 'TYPE'],
  },
};

/** Intenta obtener el primer valor no vacío de una lista de campos */
function pickField(props: Record<string, unknown>, fields: string[]): string | undefined {
  for (const f of fields) {
    const v = props[f];
    if (v != null && String(v).trim() !== '' && String(v) !== '-99') {
      return String(v).trim();
    }
  }
  return undefined;
}

/** Genera un id estable a partir de propiedades o índice */
function makeId(theme: ThemeId, props: Record<string, unknown>, index: number, name?: string): string {
  const code = pickField(props, ['ISO_A2', 'ISO_A3', 'ADM0_A3', 'ADM1_CODE', 'ne_id', 'scalerank']);
  if (code) return `${theme}-${code}`;
  if (name) return `${theme}-${name.toLowerCase().replace(/\s+/g, '-')}-${index}`;
  return `${theme}-${index}`;
}

/**
 * Normaliza un FeatureCollection (o array de Features) a GeoEntity[].
 * Ignora features sin geometría o que no pasan el filtro.
 */
export function normalizeFeatureCollection(
  data: FeatureCollection | Feature[],
  theme: ThemeId,
  mapping: PropertyMapping = DEFAULT_MAPPINGS[theme]
): GeoEntity[] {
  const features = Array.isArray(data) ? data : data.features ?? [];
  const entities: GeoEntity[] = [];

  features.forEach((feature, index) => {
    if (!feature || !feature.geometry) return;

    const props = (feature.properties ?? {}) as Record<string, unknown>;

    // Filtro opcional
    if (mapping.filter) {
      const val = props[mapping.filter.field];
      if (val == null || !mapping.filter.values.includes(String(val))) {
        return;
      }
    }

    const name = pickField(props, mapping.nameFields);
    if (!name) return; // sin nombre no es útil para el juego

    const geometry = feature.geometry as Geometry;
    // Solo aceptamos tipos que el tema soporta (se puede relajar)
    const allowed = ['Polygon', 'MultiPolygon', 'Point', 'LineString', 'MultiLineString'];
    if (!allowed.includes(geometry.type)) return;

    entities.push({
      id: makeId(theme, props, index, name),
      name,
      nameAlt: mapping.nameAltFields ? pickField(props, mapping.nameAltFields) : undefined,
      theme,
      subtype: mapping.subtypeFields ? pickField(props, mapping.subtypeFields) : undefined,
      code: mapping.codeFields ? pickField(props, mapping.codeFields) : undefined,
      geometry,
      rawProperties: props,
    });
  });

  return entities;
}

/**
 * Carga un archivo JSON/GeoJSON desde public/data/ y lo normaliza.
 * Ejemplo de uso:
 *   const entities = await loadThemeData('countries', '/data/ne_50m_admin_0_countries.json');
 */
export async function loadThemeData(
  theme: ThemeId,
  url: string,
  mapping?: PropertyMapping
): Promise<GeoEntity[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${url}: ${res.status}`);
  }
  const data = await res.json();
  return normalizeFeatureCollection(data, theme, mapping ?? DEFAULT_MAPPINGS[theme]);
}

/**
 * Utilidad para combinar varias fuentes de un mismo tema.
 */
export function mergeEntities(...lists: GeoEntity[][]): GeoEntity[] {
  const seen = new Set<string>();
  const result: GeoEntity[] = [];
  for (const list of lists) {
    for (const e of list) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        result.push(e);
      }
    }
  }
  return result;
}
