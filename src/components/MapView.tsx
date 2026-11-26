import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoEntity } from '../types/geo';
import { toFeatureCollection } from '../data/mockData';
import { getEntityCenter } from '../game/geometry';

interface MapViewProps {
  entities: GeoEntity[];
  highlightedEntity?: GeoEntity | null;
  clickedLngLat?: [number, number] | null;
  /** true = acierto (confeti en App); false = fallo → destello del punto correcto */
  wasCorrect?: boolean | null;
  /** Siluetas de países de fondo (p. ej. modo ríos) — no son clicables de pregunta */
  countryOutlines?: GeoEntity[];
  onMapClick: (lng: number, lat: number) => void;
  interactive: boolean;
  /** Incrementar al inicio de partida y en cada "Siguiente" */
  viewResetKey?: number;
}

const WORLD = { center: [0, 20] as [number, number], zoom: 1.8 };

/**
 * Mapa base mudo (sin nombres de países).
 * Esri World Shaded Relief — relieve sombreado, sin etiquetas.
 * Alternativa CartoDB PositronNoLabels si hace falta:
 *   https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png
 */
const MUTE_BASE_STYLE = {
  version: 8 as const,
  sources: {
    basemap: {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri — World Shaded Relief',
      maxzoom: 13,
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster' as const,
      source: 'basemap',
      minzoom: 0,
      maxzoom: 13,
    },
  ],
};

function ensureSources(map: maplibregl.Map) {
  if (!map.getSource('country-outlines')) {
    map.addSource('country-outlines', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource('entities')) {
    map.addSource('entities', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource('highlight')) {
    map.addSource('highlight', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource('click-marker')) {
    map.addSource('click-marker', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource('answer-pulse')) {
    map.addSource('answer-pulse', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  const addIfMissing = (id: string, layer: maplibregl.AddLayerObject) => {
    if (!map.getLayer(id)) map.addLayer(layer);
  };

  // Siluetas de países (auxiliar, p. ej. detrás de ríos)
  addIfMissing('country-outlines-fill', {
    id: 'country-outlines-fill',
    type: 'fill',
    source: 'country-outlines',
    paint: { 'fill-color': '#cbd5e1', 'fill-opacity': 0.35 },
  });
  addIfMissing('country-outlines-line', {
    id: 'country-outlines-line',
    type: 'line',
    source: 'country-outlines',
    paint: { 'line-color': '#64748b', 'line-width': 0.8, 'line-opacity': 0.7 },
  });
  addIfMissing('entities-fill', {
    id: 'entities-fill',
    type: 'fill',
    source: 'entities',
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
    paint: { 'fill-color': '#94a3b8', 'fill-opacity': 0.2 },
  });
  addIfMissing('entities-outline', {
    id: 'entities-outline',
    type: 'line',
    source: 'entities',
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
    paint: { 'line-color': '#64748b', 'line-width': 1 },
  });
  addIfMissing('entities-line', {
    id: 'entities-line',
    type: 'line',
    source: 'entities',
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
    paint: { 'line-color': '#0ea5e9', 'line-width': 2.5 },
  });
  addIfMissing('entities-point', {
    id: 'entities-point',
    type: 'circle',
    source: 'entities',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': 6,
      'circle-color': '#64748b',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
    },
  });
  addIfMissing('highlight-fill', {
    id: 'highlight-fill',
    type: 'fill',
    source: 'highlight',
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
    paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.55 },
  });
  addIfMissing('highlight-line', {
    id: 'highlight-line',
    type: 'line',
    source: 'highlight',
    paint: { 'line-color': '#16a34a', 'line-width': 6 },
  });
  addIfMissing('highlight-point', {
    id: 'highlight-point',
    type: 'circle',
    source: 'highlight',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': 12,
      'circle-color': '#22c55e',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#fff',
    },
  });
  addIfMissing('click-marker-circle', {
    id: 'click-marker-circle',
    type: 'circle',
    source: 'click-marker',
    paint: {
      'circle-radius': 9,
      'circle-color': '#f59e0b',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
  // Anillo de destello en el punto correcto (fallos / zonas pequeñas)
  addIfMissing('answer-pulse-outer', {
    id: 'answer-pulse-outer',
    type: 'circle',
    source: 'answer-pulse',
    paint: {
      'circle-radius': 28,
      'circle-color': '#ef4444',
      'circle-opacity': 0.25,
      'circle-stroke-width': 3,
      'circle-stroke-color': '#ef4444',
      'circle-stroke-opacity': 0.9,
    },
  });
  addIfMissing('answer-pulse-inner', {
    id: 'answer-pulse-inner',
    type: 'circle',
    source: 'answer-pulse',
    paint: {
      'circle-radius': 10,
      'circle-color': '#ef4444',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#fff',
    },
  });
}

function clearOverlays(map: maplibregl.Map) {
  const empty = { type: 'FeatureCollection' as const, features: [] };
  const h = map.getSource('highlight') as maplibregl.GeoJSONSource | undefined;
  const c = map.getSource('click-marker') as maplibregl.GeoJSONSource | undefined;
  const p = map.getSource('answer-pulse') as maplibregl.GeoJSONSource | undefined;
  if (h) h.setData(empty);
  if (c) c.setData(empty);
  if (p) p.setData(empty);
}

function goWorld(map: maplibregl.Map) {
  map.stop();
  map.jumpTo({
    center: WORLD.center,
    zoom: WORLD.zoom,
    bearing: 0,
    pitch: 0,
  });
}

function fitClickAndAnswer(
  map: maplibregl.Map,
  click: [number, number],
  answer: [number, number]
) {
  const [lng1, lat1] = click;
  const [lng2, lat2] = answer;
  map.stop();

  if (Math.abs(lng1 - lng2) < 0.08 && Math.abs(lat1 - lat2) < 0.08) {
    map.easeTo({ center: answer, zoom: 5, duration: 700 });
    return;
  }

  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  const padLng = Math.max((maxLng - minLng) * 0.2, 1);
  const padLat = Math.max((maxLat - minLat) * 0.2, 1);

  map.fitBounds(
    [
      [minLng - padLng, minLat - padLat],
      [maxLng + padLng, maxLat + padLat],
    ],
    {
      padding: { top: 80, bottom: 140, left: 48, right: 48 },
      maxZoom: 8,
      duration: 800,
    }
  );
}

export function MapView({
  entities,
  highlightedEntity,
  clickedLngLat,
  wasCorrect = null,
  countryOutlines = [],
  onMapClick,
  interactive,
  viewResetKey = 0,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onClickRef = useRef(onMapClick);
  const interactiveRef = useRef(interactive);
  const readyRef = useRef(false);
  onClickRef.current = onMapClick;
  interactiveRef.current = interactive;

  // ── Init mapa ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MUTE_BASE_STYLE as any,
      center: WORLD.center,
      zoom: WORLD.zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), 'bottom-left');

    map.on('load', () => {
      ensureSources(map);
      readyRef.current = true;
    });

    map.on('click', (e) => {
      if (!interactiveRef.current) return;
      onClickRef.current(e.lngLat.lng, e.lngLat.lat);
    });

    mapRef.current = map;
    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Entidades de la temática ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      ensureSources(map);
      const src = map.getSource('entities') as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(toFeatureCollection(entities) as any);
    };
    if (readyRef.current || map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [entities]);

  // ── Siluetas de países (modo ríos) ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      ensureSources(map);
      const src = map.getSource('country-outlines') as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(toFeatureCollection(countryOutlines) as any);
    };
    if (readyRef.current || map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [countryOutlines]);

  // ── Reset mundial (inicio / Siguiente) ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (viewResetKey === 0) return;

    const run = () => {
      ensureSources(map);
      clearOverlays(map);
      goWorld(map);
    };

    if (readyRef.current || map.isStyleLoaded()) run();
    else map.once('load', run);
  }, [viewResetKey]);

  // ── Feedback: resaltar + marcar clic + zoom a ambos ────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = () => {
      ensureSources(map);

      // Solo en fase de respuesta
      if (!highlightedEntity || !clickedLngLat) {
        return;
      }

      const highlightSrc = map.getSource('highlight') as maplibregl.GeoJSONSource;
      const clickSrc = map.getSource('click-marker') as maplibregl.GeoJSONSource;
      const pulseSrc = map.getSource('answer-pulse') as maplibregl.GeoJSONSource | undefined;

      const answerCenter = getEntityCenter(highlightedEntity.geometry);
      const isMiss = wasCorrect === false;
      const accent = isMiss ? '#ef4444' : '#22c55e';

      try {
        if (map.getLayer('highlight-fill')) {
          map.setPaintProperty('highlight-fill', 'fill-color', accent);
        }
        if (map.getLayer('highlight-line')) {
          map.setPaintProperty('highlight-line', 'line-color', accent);
          map.setPaintProperty('highlight-line', 'line-width', isMiss ? 7 : 6);
        }
        if (map.getLayer('highlight-point')) {
          map.setPaintProperty('highlight-point', 'circle-color', accent);
        }
      } catch { /* */ }

      highlightSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: highlightedEntity.geometry,
          },
        ],
      });

      clickSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: clickedLngLat },
          },
        ],
      });

      // Destello en el centro de la respuesta (sobre todo si falló o es zona pequeña)
      if (pulseSrc) {
        pulseSrc.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Point', coordinates: answerCenter },
            },
          ],
        });
        const pulseColor = isMiss ? '#ef4444' : '#22c55e';
        try {
          if (map.getLayer('answer-pulse-outer')) {
            map.setPaintProperty('answer-pulse-outer', 'circle-color', pulseColor);
            map.setPaintProperty('answer-pulse-outer', 'circle-stroke-color', pulseColor);
            map.setPaintProperty('answer-pulse-outer', 'circle-radius', isMiss ? 36 : 24);
          }
          if (map.getLayer('answer-pulse-inner')) {
            map.setPaintProperty('answer-pulse-inner', 'circle-color', pulseColor);
          }
        } catch { /* */ }
      }

      requestAnimationFrame(() => {
        fitClickAndAnswer(map, clickedLngLat, answerCenter);
      });
    };

    if (readyRef.current || map.isStyleLoaded()) run();
    else map.once('load', run);
  }, [highlightedEntity, clickedLngLat, wasCorrect]);

  // ── Cursor ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = interactive ? 'crosshair' : 'default';
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden shadow-inner"
      style={{ minHeight: 400 }}
    />
  );
}
