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
  onMapClick: (lng: number, lat: number) => void;
  interactive: boolean; // false mientras se muestra feedback
  /** Cambia al empezar partida / siguiente pregunta → restablece zoom mundial */
  viewResetKey?: string | number;
}

const WORLD_VIEW = { center: [0, 20] as [number, number], zoom: 1.8 };

/** Ajusta el mapa para que se vean el clic del usuario y el centro de la respuesta */
function fitClickAndAnswer(
  map: maplibregl.Map,
  click: [number, number],
  answerCenter: [number, number]
) {
  const [lng1, lat1] = click;
  const [lng2, lat2] = answerCenter;

  // Mismo punto (casi): zoom local fijo
  const same =
    Math.abs(lng1 - lng2) < 0.05 && Math.abs(lat1 - lat2) < 0.05;

  map.stop();
  if (same) {
    map.easeTo({ center: answerCenter, zoom: 5, duration: 700 });
    return;
  }

  const minLng = Math.min(lng1, lng2);
  const maxLng = Math.max(lng1, lng2);
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);

  // Evitar bounds degenerados
  const padLng = Math.max((maxLng - minLng) * 0.15, 0.5);
  const padLat = Math.max((maxLat - minLat) * 0.15, 0.5);

  map.fitBounds(
    [
      [minLng - padLng, minLat - padLat],
      [maxLng + padLng, maxLat + padLat],
    ],
    {
      padding: { top: 60, bottom: 120, left: 40, right: 40 },
      maxZoom: 8,
      duration: 800,
    }
  );
}

function goWorld(map: maplibregl.Map) {
  map.stop();
  map.jumpTo({
    center: WORLD_VIEW.center,
    zoom: WORLD_VIEW.zoom,
    bearing: 0,
    pitch: 0,
  });
}
/**
 * Mapa base mudo, sin API key.
 * Esri World Light Gray Base — costas y relieve suave, sin nombres de países.
 * (Orden de tiles Esri: {z}/{y}/{x})
 */
const MUTE_BASE_STYLE = {
  version: 8 as const,
  sources: {
    basemap: {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri',
      maxzoom: 16,
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster' as const,
      source: 'basemap',
      minzoom: 0,
      maxzoom: 16,
    },
  ],
};

export function MapView({
  entities,
  highlightedEntity,
  clickedLngLat,
  onMapClick,
  interactive,
  viewResetKey = 0,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onClickRef = useRef(onMapClick);
  const interactiveRef = useRef(interactive);
  onClickRef.current = onMapClick;
  interactiveRef.current = interactive;

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MUTE_BASE_STYLE as any,
      center: [0, 30],
      zoom: 2,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120 }), 'bottom-left');

    map.on('load', () => {
      // Fuente vacía para entidades
      map.addSource('entities', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Polígonos (fill + outline)
      map.addLayer({
        id: 'entities-fill',
        type: 'fill',
        source: 'entities',
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'fill-color': '#94a3b8',
          'fill-opacity': 0.15,
        },
      });
      map.addLayer({
        id: 'entities-outline',
        type: 'line',
        source: 'entities',
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'line-color': '#64748b',
          'line-width': 1,
        },
      });

      // Líneas (ríos)
      map.addLayer({
        id: 'entities-line',
        type: 'line',
        source: 'entities',
        filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 2.5,
        },
      });

      // Puntos (capitales, picos)
      map.addLayer({
        id: 'entities-point',
        type: 'circle',
        source: 'entities',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#ef4444',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#fff',
        },
      });

      // Highlight (capa separada)
      map.addSource('highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'highlight-fill',
        type: 'fill',
        source: 'highlight',
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.45,
        },
      });
      map.addLayer({
        id: 'highlight-line',
        type: 'line',
        source: 'highlight',
        paint: {
          'line-color': '#16a34a',
          'line-width': 5,
          'line-opacity': 1,
        },
      });
      map.addLayer({
        id: 'highlight-point',
        type: 'circle',
        source: 'highlight',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 10,
          'circle-color': '#22c55e',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Marcador de clic del usuario
      map.addSource('click-marker', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'click-marker-circle',
        type: 'circle',
        source: 'click-marker',
        paint: {
          'circle-radius': 8,
          'circle-color': '#f59e0b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    });

    // Clic en el mapa (usar ref para no quedar con el valor inicial de interactive)
    map.on('click', (e) => {
      if (!interactiveRef.current) return;
      const { lng, lat } = e.lngLat;
      onClickRef.current(lng, lat);
    });

    // Cursor
    map.on('mouseenter', 'entities-fill', () => {
      map.getCanvas().style.cursor = interactiveRef.current ? 'pointer' : 'default';
    });
    map.on('mouseleave', 'entities-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar entidades en el mapa (todos los ríos / países / etc.)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const source = map.getSource('entities') as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(toFeatureCollection(entities) as any);
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [entities]);

  /**
   * Lógica de identificación + cámara
   * ─────────────────────────────────
   * PREGUNTA (sin result): vista mundial, sin highlight.
   * RESPUESTA (hay entity + clic): resalta geometría, marca clic,
   *   zoom que abarca ambos puntos.
   * SIGUIENTE / inicio (viewResetKey ↑): limpia y vuelve a vista mundial.
   */
  const lastResetKey = useRef<string | number | null>(null);
  const lastFeedbackId = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;

      const highlightSrc = map.getSource('highlight') as maplibregl.GeoJSONSource | undefined;
      const clickSrc = map.getSource('click-marker') as maplibregl.GeoJSONSource | undefined;

      // ── A) Reset mundial (inicio de partida o "Siguiente") ──
      const resetChanged = lastResetKey.current !== viewResetKey;
      if (resetChanged) {
        lastResetKey.current = viewResetKey;
        lastFeedbackId.current = null;
        if (highlightSrc) {
          highlightSrc.setData({ type: 'FeatureCollection', features: [] });
        }
        if (clickSrc) {
          clickSrc.setData({ type: 'FeatureCollection', features: [] });
        }
        goWorld(map);
        return;
      }

      // ── B) Feedback: clic + respuesta correcta ──
      if (highlightedEntity && clickedLngLat) {
        const feedbackId = `${highlightedEntity.id}:${clickedLngLat[0]},${clickedLngLat[1]}`;
        // Solo animar una vez por respuesta
        const isNewFeedback = lastFeedbackId.current !== feedbackId;
        lastFeedbackId.current = feedbackId;

        if (highlightSrc) {
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
        }
        if (clickSrc) {
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
        }

        if (isNewFeedback) {
          const answerCenter = getEntityCenter(highlightedEntity.geometry);
          fitClickAndAnswer(map, clickedLngLat, answerCenter);
        }
        return;
      }

      // ── C) Sin feedback: limpiar overlays (mantener cámara) ──
      if (highlightSrc) {
        highlightSrc.setData({ type: 'FeatureCollection', features: [] });
      }
      if (clickSrc) {
        clickSrc.setData({ type: 'FeatureCollection', features: [] });
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [highlightedEntity, clickedLngLat, viewResetKey]);

  // Actualizar cursor según interactive
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = interactive ? '' : 'default';
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden shadow-inner"
      style={{ minHeight: 400 }}
    />
  );
}
