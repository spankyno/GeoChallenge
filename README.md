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

## Seguridad (actualización)

### Migraciones D1

Aplica también la migración de seguridad:

```bash
npx wrangler d1 migrations apply geo-challenge-db --remote
```

La migración `0003_security.sql` crea las tablas de limitación de peticiones y de partidas diarias anónimas. Si no utilizas el sistema de migraciones de Wrangler, ejecuta el SQL de ese archivo sobre la base D1 vinculada como `DB`.

### Verificación de sesiones Clerk

En Cloudflare Pages → Settings → Variables and Secrets, configura `CLERK_JWT_PUBLIC_KEY` con la clave pública PEM de la misma aplicación Clerk utilizada por el frontend (Clerk Dashboard → API Keys → JWT public key). No introduzcas la clave privada ni la Secret Key de Clerk. Después, vuelve a desplegar.

Las puntuaciones de usuarios autenticados se asocian exclusivamente al `sub` del JWT verificado; el backend ignora cualquier `clerk_user_id` enviado por el navegador. Si la clave pública no está configurada, las peticiones autenticadas se rechazan de forma segura.

### Límites y alcance anti-trampas

- `POST /api/scores`: máximo 8 envíos por IP y minuto, tamaño JSON limitado, validación estricta de campos y comprobaciones de coherencia de puntuación.
- `POST /api/plays`: máximo 5 partidas diarias de invitado por IP, registrado en D1. Es un límite compartido por usuarios que salen a Internet con la misma IP.
- La API no confía en el identificador de usuario recibido del cliente.
- La inserción y poda del top 100 se ejecutan mediante un batch transaccional de D1.

**Limitación importante:** el motor de preguntas y el cálculo de las respuestas siguen ejecutándose en el navegador. Las comprobaciones matemáticas impiden valores fuera de los límites plausibles, pero no demuestran que una partida se haya jugado realmente. Para un ranking plenamente resistente a trampas habría que trasladar la emisión de preguntas y la evaluación de respuestas al servidor. Esta versión no presenta el ranking como criptográficamente verificable.

### Cabeceras HTTP

El archivo `public/_headers` se copia a `dist/_headers` durante el build e incluye CSP y cabeceras anti-clickjacking, MIME sniffing y referrer. Si Clerk o el mapa dejan de cargar por cambios en sus dominios/CDN, ajusta explícitamente las directivas CSP; evita eliminar toda la política.
