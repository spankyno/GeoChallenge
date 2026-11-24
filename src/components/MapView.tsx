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

  // Highlight de la respuesta correcta
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('highlight') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (highlightedEntity) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: highlightedEntity.geometry,
          },
        ],
      });
      const center = getEntityCenter(highlightedEntity.geometry);
      map.flyTo({ center, zoom: Math.max(map.getZoom(), 4), duration: 800 });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [highlightedEntity]);

  // Extensión mundial al empezar partida y entre preguntas
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!interactive || highlightedEntity) return;
    map.stop();
    map.flyTo({ ...WORLD_VIEW, duration: 600 });
  }, [viewResetKey, interactive, highlightedEntity]);

  // Marcador del clic del usuario
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('click-marker') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (clickedLngLat) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: clickedLngLat },
          },
        ],
      });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [clickedLngLat]);

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
