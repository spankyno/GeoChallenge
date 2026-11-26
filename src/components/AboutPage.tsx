interface AboutPageProps {
  onBack: () => void;
  onPrivacy: () => void;
}

export function AboutPage({ onBack, onPrivacy }: AboutPageProps) {
  return (
    <div className="min-h-full w-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver al juego
        </button>

        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">GeoChallenge</h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Juego web de geografía sobre un mapa interactivo: identifica países, capitales, ríos,
            provincias y accidentes geográficos haciendo clic en el lugar correcto.
          </p>
        </header>

        <img
          src="/og-image.png"
          alt="GeoChallenge — juego de geografía sobre un mapa"
          width={1200}
          height={630}
          className="w-full rounded-xl shadow-md border border-slate-200 object-cover"
          loading="eager"
          decoding="async"
        />

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">Cómo se juega</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1.5 text-sm leading-relaxed">
            <li>Elige una o varias temáticas y el nivel de dificultad (1–5).</li>
            <li>
              <strong>Modo preciso:</strong> acierto si clicas dentro de la tolerancia del lugar.
            </li>
            <li>
              <strong>Modo distancia:</strong> más puntos cuanto más cerca estés (en kilómetros).
            </li>
            <li>Cada pregunta tiene <strong>15 segundos</strong>. Si se agota el tiempo, no podrás
              guardar el récord de esa partida.</li>
            <li>Al responder verás la geometría correcta, tu clic y el zoom a ambos puntos.</li>
            <li>El ranking guarda solo las <strong>100 mejores</strong> puntuaciones (D1).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">Temáticas</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1 text-sm">
            <li>Países</li>
            <li>Capitales</li>
            <li>Ríos (con siluetas de países de fondo)</li>
            <li>Provincias / estados</li>
            <li>Accidentes geográficos (desiertos, islas, mesetas, montañas…)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">Usuarios y límites</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1.5 text-sm leading-relaxed">
            <li>
              <strong>Invitado:</strong> hasta 5 partidas al día. En el ranking aparece como
              «Anónimo».
            </li>
            <li>
              <strong>Registrado (Clerk):</strong> partidas ilimitadas y nombre personalizable en el
              ranking.
            </li>
            <li>
              Si alguna pregunta supera los 15 s, la partida queda marcada y no se puede enviar al
              ranking.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">Stack tecnológico</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="font-medium text-slate-800">Frontend</div>
              <p>React, TypeScript, Vite, Tailwind CSS, MapLibre GL JS</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="font-medium text-slate-800">Datos</div>
              <p>Natural Earth (GeoJSON 50m / 10m provincias), adaptador propio</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="font-medium text-slate-800">Backend</div>
              <p>Cloudflare Pages Functions + D1 (ranking)</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="font-medium text-slate-800">Auth</div>
              <p>Clerk (registro opcional)</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">Autor</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>Aitor Sánchez Gutiérrez</strong>
            <br />
            <a
              href="https://aitorsanchez.pages.dev/"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blog
            </a>
            {' · '}
            <a
              href="https://aitorhub.vercel.app/"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Aitor Hub
            </a>
            {' · '}
            <a
              href="https://aitorsanchez.pages.dev/contacto/"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacto
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-800">Privacidad</h2>
          <p className="text-sm text-slate-600">
            Consulta cómo tratamos los datos de analítica y el ranking en la{' '}
            <button type="button" onClick={onPrivacy} className="text-blue-600 hover:underline">
              Política de Privacidad
            </button>
            .
          </p>
        </section>

        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Jugar ahora
        </button>
      </div>
    </div>
  );
}
