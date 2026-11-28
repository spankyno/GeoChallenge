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

## Autenticación (Clerk)

1. Crea una aplicación en [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copia la **Publishable key** (`pk_test_…` o `pk_live_…`).
3. En local, crea `.env.local`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   ```
4. En **Cloudflare Pages → Settings → Environment variables**:
   - `VITE_CLERK_PUBLISHABLE_KEY` = tu clave (Production y Preview)
5. En Clerk → **Domains**, añade tu dominio `*.pages.dev` y el dominio custom.
6. Redeploy.

### Reglas de juego
| Usuario | Límite | Nombre en ranking |
|---------|--------|-------------------|
| Invitado (sin login) | 5 partidas / día (localStorage) | Siempre `Anónimo` |
| Registrado (Clerk) | Ilimitado | Editable al guardar |

## Validar ranking D1 en producción

```bash
# 1. Migraciones
npx wrangler d1 execute geo-challenge-db --remote --file=./migrations/0001_scores.sql
npx wrangler d1 execute geo-challenge-db --remote --file=./migrations/0002_clerk_user.sql

# 2. Binding Pages: variable name = DB

# 3. GET
curl -s "https://TU-DOMINIO.pages.dev/api/scores?limit=5"

# 4. POST de prueba
curl -s -X POST "https://TU-DOMINIO.pages.dev/api/scores" \
  -H "Content-Type: application/json" \
  -d '{"username":"TestD1","game_mode":"precise","difficulty":2,"themes":"[\"countries\"]","score":100,"correct":2,"total":5,"hints_used":0}'

# 5. Debe devolver 201 y el GET mostrar la fila
```

Si GET devuelve `D1 binding DB missing`, el binding no está en el entorno de ese deploy.
