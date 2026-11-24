/**
 * Generación de pistas progresivas (1 = suave, 3 = más reveladora).
 */

import type { GeoEntity } from '../types/geo';
import { getEntityCenter } from './geometry';

function firstLetter(name: string): string {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : '?';
}

function hemisphere(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'hemisferio norte' : 'hemisferio sur';
  const ew = lng >= 0 ? 'este' : 'oeste';
  return `${ns}, ${ew}`;
}

function regionFromProps(entity: GeoEntity): string | undefined {
  const p = entity.rawProperties ?? {};
  for (const key of ['REGION', 'region', 'SUBREGION', 'subregion', 'CONTINENT', 'admin', 'ADM0NAME', 'adm0name']) {
    const v = p[key];
    if (v != null && String(v).trim() && String(v) !== '-99') return String(v).trim();
  }
  return undefined;
}

/** Devuelve hasta 3 pistas ordenadas de menos a más reveladoras */
export function buildHints(entity: GeoEntity): string[] {
  const hints: string[] = [];
  const [lng, lat] = getEntityCenter(entity.geometry);

  if (entity.subtype) {
    hints.push(`Tipo: ${entity.subtype}`);
  } else {
    hints.push(`Categoría: ${entity.theme}`);
  }

  const region = regionFromProps(entity);
  if (region) {
    hints.push(`Región: ${region}`);
  } else {
    hints.push(`Ubicación aproximada: ${hemisphere(lat, lng)}`);
  }

  hints.push(`Inicial: «${firstLetter(entity.name)}» · ${hemisphere(lat, lng)}`);

  return hints.slice(0, 3);
}
