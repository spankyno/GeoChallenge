/**
 * Evaluación de aciertos por geometría (implementación ligera sin dependencia pesada).
 * - Polygon / MultiPolygon → ray-casting point-in-polygon
 * - Point → distancia haversine + radio de tolerancia
 * - LineString → distancia al segmento más cercano
 *
 * Cuando se carguen los JSON reales se puede sustituir por @turf/turf si se desea.
 */

import type { Geometry, Position, Polygon, MultiPolygon, LineString, MultiLineString, Point } from 'geojson';
import type { GeoEntity } from '../types/geo';

/** Radio de tolerancia en km según dificultad (1 = fácil, 5 = difícil) */
export function toleranceForDifficulty(
  baseKm: number,
  difficulty: 1 | 2 | 3 | 4 | 5
): number {
  const factors = [0, 2.5, 1.8, 1.2, 0.8, 0.4];
  return baseKm * factors[difficulty];
}

/** Distancia haversine en km */
function haversineKm(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Point-in-polygon (ray casting) para un anillo */
function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, poly: Polygon): boolean {
  const [outer, ...holes] = poly.coordinates;
  if (!pointInRing(lng, lat, outer)) return false;
  for (const hole of holes) {
    if (pointInRing(lng, lat, hole)) return false;
  }
  return true;
}

function pointInMultiPolygon(lng: number, lat: number, mp: MultiPolygon): boolean {
  return mp.coordinates.some((polyCoords) =>
    pointInPolygon(lng, lat, { type: 'Polygon', coordinates: polyCoords })
  );
}

/** Distancia mínima de un punto a un segmento (aproximación euclídea en grados, luego haversine) */
function distToSegmentKm(
  lng: number,
  lat: number,
  a: Position,
  b: Position
): number {
  // Proyección simple
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = Math.max(0, Math.min(1, ((lng - a[0]) * dx + (lat - a[1]) * dy) / len2));
  }
  const projLng = a[0] + t * dx;
  const projLat = a[1] + t * dy;
  return haversineKm(lng, lat, projLng, projLat);
}

function distToLineStringKm(lng: number, lat: number, line: LineString): number {
  let min = Infinity;
  const coords = line.coordinates;
  for (let i = 0; i < coords.length - 1; i++) {
    min = Math.min(min, distToSegmentKm(lng, lat, coords[i], coords[i + 1]));
  }
  return min;
}

function distToMultiLineStringKm(lng: number, lat: number, ml: MultiLineString): number {
  let min = Infinity;
  for (const line of ml.coordinates) {
    min = Math.min(min, distToLineStringKm(lng, lat, { type: 'LineString', coordinates: line }));
  }
  return min;
}

/**
 * Comprueba si el clic (lng, lat) acierta la entidad.
 */
export function evaluateClick(
  entity: GeoEntity,
  lng: number,
  lat: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
  baseToleranceKm: number
): { correct: boolean; distanceKm: number } {
  const geom = entity.geometry;
  const tol = toleranceForDifficulty(baseToleranceKm, difficulty);

  if (geom.type === 'Polygon') {
    const inside = pointInPolygon(lng, lat, geom);
    return { correct: inside, distanceKm: inside ? 0 : Infinity };
  }
  if (geom.type === 'MultiPolygon') {
    const inside = pointInMultiPolygon(lng, lat, geom);
    return { correct: inside, distanceKm: inside ? 0 : Infinity };
  }
  if (geom.type === 'Point') {
    const [plng, plat] = (geom as Point).coordinates;
    const dist = haversineKm(lng, lat, plng, plat);
    return { correct: dist <= tol, distanceKm: dist };
  }
  if (geom.type === 'LineString') {
    const dist = distToLineStringKm(lng, lat, geom);
    return { correct: dist <= tol, distanceKm: dist };
  }
  if (geom.type === 'MultiLineString') {
    const dist = distToMultiLineStringKm(lng, lat, geom);
    return { correct: dist <= tol, distanceKm: dist };
  }

  return { correct: false, distanceKm: Infinity };
}

/** Centro aproximado de una geometría */
export function getEntityCenter(geometry: Geometry): [number, number] {
  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number];
  }
  // Bounding box simple
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const walk = (coords: any) => {
    if (typeof coords[0] === 'number') {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    } else {
      coords.forEach(walk);
    }
  };
  walk((geometry as any).coordinates);
  if (!isFinite(minLng)) return [0, 20];
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}
