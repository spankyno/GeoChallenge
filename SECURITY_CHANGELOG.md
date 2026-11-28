# GeoChallenge – cambios de seguridad

## Cambios incluidos

- La API de puntuaciones deja de aceptar `clerk_user_id` desde el navegador. Para cuentas autenticadas verifica la firma RS256, expiración y sujeto del JWT de Clerk con una clave pública configurada en el servidor.
- Validación estricta del JSON, tamaño máximo, tipos, rangos, temáticas permitidas y coherencia matemática básica entre puntuación, aciertos y preguntas.
- El ranking ya no devuelve el identificador interno de Clerk.
- Límite de 8 envíos de puntuaciones por IP/minuto y 10 solicitudes de reserva de partida por IP/minuto, guardados en D1.
- Reserva de un máximo de 5 partidas diarias de invitado por IP en D1. `localStorage` queda como contador visual, no como control de seguridad.
- Inserción y poda del top 100 mediante `D1.batch()`.
- Errores internos registrados en logs del servidor; las respuestas HTTP no exponen detalles de D1.
- Validación de origen y Fetch Metadata para solicitudes de API.
- Nuevas tablas e índices en `migrations/0003_security.sql`.
- Cabeceras de seguridad y Content Security Policy en `public/_headers`.

## Configuración requerida

1. Aplicar `npx wrangler d1 migrations apply geo-challenge-db --remote`.
2. En Cloudflare Pages, configurar la variable `CLERK_JWT_PUBLIC_KEY` con la clave pública PEM de Clerk correspondiente a la misma instancia usada por `VITE_CLERK_PUBLISHABLE_KEY`.
3. Desplegar de nuevo el proyecto.

## Limitaciones que deben conocerse

El motor de juego y la evaluación geográfica permanecen en el navegador. Las validaciones del servidor reducen puntuaciones manifiestamente imposibles, pero no pueden demostrar que las respuestas se hayan jugado realmente. El límite de partidas se aplica al flujo normal de la aplicación mediante reserva D1, pero un cliente modificado puede saltarse la interfaz y seguir jugando localmente. Para conseguir un ranking realmente anti-trampas es necesario mover al servidor la generación de preguntas, recepción de respuestas y cálculo de puntos, y exigir una sesión de partida de un solo uso.

El límite de invitado se aplica por IP pública, no por persona. Usuarios distintos detrás de la misma conexión comparten el cupo de cinco partidas.
