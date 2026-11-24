# GeoChallenge

Juego de geografía interactivo sobre un mapa. Elige temáticas (países, capitales, etc.), dificultad y señala el lugar haciendo clic.

## Stack

- React + TypeScript + Vite
- MapLibre GL JS
- Tailwind CSS
- Datos: Natural Earth 50m (GeoJSON)

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en Cloudflare Pages

1. Sube este repositorio a GitHub.
2. En Cloudflare Pages → Create project → Connect to Git → selecciona el repo.
3. Configuración de build:

| Setting                  | Valor           |
|--------------------------|-----------------|
| Framework preset         | Vite            |
| Build command            | `npm run build` |
| Build output directory   | `dist`          |
| Node version             | 18 o 20         |

4. Deploy. Listo.

Los archivos GeoJSON de países y capitales ya están en `public/data/` y se sirven como estáticos.

## Estructura

```
src/
  components/   MapView, SetupPanel, QuestionPanel, SummaryPanel
  data/         adapter, loader, mockData
  game/         engine, geometry
  types/        geo.ts
public/
  data/         ne_50m_admin_0_countries.geojson
                ne_50m_populated_places.geojson
```

## Temáticas

| Temática   | Datos                          |
|------------|--------------------------------|
| Países     | Natural Earth 50m (242)        |
| Capitales  | Natural Earth 50m (~215)       |
| Provincias | Mock (ampliable)               |
| Ríos       | Mock (ampliable)               |
| Accidentes | Mock (ampliable)               |

Para añadir más capas: coloca el GeoJSON en `public/data/`, registra la ruta en `src/data/loader.ts` y ajusta el mapping en `src/data/adapter.ts` si hace falta.
