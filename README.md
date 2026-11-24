# GeoChallenge

Juego de geografía interactivo sobre un mapa (React + Vite + MapLibre).

## Desarrollo local

```bash
npm install
npm run dev
```

## Modos de juego

| Modo | Descripción |
|------|-------------|
| **Preciso** | Solo cuenta acierto si clicas dentro de la tolerancia (más estricta con la dificultad) |
| **Distancia** | Siempre suma puntos según los km de error; se muestra la distancia real |

### Pistas
- Activables en el setup (Sí/No)
- Máximo 1–3 pistas por pregunta
- Presupuesto total de pistas en la ronda
- Cada pista usada reduce ligeramente los puntos de esa pregunta

## Ranking (Cloudflare D1)

Campos: Fecha/Hora, Usuario, Modo, Dificultad, Puntuación (también correctas/total y pistas).

Usuario por defecto: **Anónimo** (auth más adelante).

### Configurar D1

1. Crea la base:
   ```bash
   npx wrangler d1 create geo-challenge-db
   ```
2. Copia el `database_id` a `wrangler.toml`.
3. Aplica el esquema:
   ```bash
   npx wrangler d1 execute geo-challenge-db --remote --file=./migrations/0001_scores.sql
   ```
4. En **Cloudflare Pages → Settings → Functions → D1 bindings**:
   - Variable name: `DB`
   - D1 database: `geo-challenge-db`

API:
- `GET /api/scores?limit=20`
- `POST /api/scores` — body JSON con score, game_mode, difficulty, themes, username…

## Despliegue Cloudflare Pages

| Setting | Valor |
|---------|--------|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node | 18 o 20 |

## Temáticas (Natural Earth 50m)

| Temática | Datos |
|----------|--------|
| Países | ~242 |
| Capitales | ~215 |
| Provincias | ~294 |
| Ríos | ~350 |
| Accidentes | ~765 |

## Estructura

```
src/          UI + motor de juego
functions/    Pages Functions (API scores)
migrations/   SQL D1
public/data/  GeoJSON
```
