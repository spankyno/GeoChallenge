interface AboutPageProps {
  onBack: () => void;
  onPrivacy: () => void;
}

const THEMES = [
  { label: 'Países', desc: 'Fronteras y territorios soberanos', icon: '🌍' },
  { label: 'Capitales', desc: 'Capitales nacionales en el mapa', icon: '🏛️' },
  { label: 'Ríos', desc: 'Cursos fluviales + siluetas de países', icon: '🌊' },
  { label: 'Provincias', desc: 'Estados y divisiones admin. 1', icon: '🗺️' },
  { label: 'Accidentes', desc: 'Desiertos, islas, mesetas, montañas…', icon: '⛰️' },
];

const STACK = [
  {
    title: 'Frontend',
    items: 'React · TypeScript · Vite · Tailwind · MapLibre GL',
  },
  {
    title: 'Datos',
    items: 'Natural Earth GeoJSON · adaptador propio',
  },
  {
    title: 'Backend',
    items: 'Cloudflare Pages Functions · D1',
  },
  {
    title: 'Auth',
    items: 'Clerk · registro opcional',
  },
];

export function AboutPage({ onBack, onPrivacy }: AboutPageProps) {
  return (
    <div className="min-h-full w-full overflow-y-auto bg-slate-950 text-slate-100">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59,130,246,0.45), transparent), radial-gradient(ellipse 50% 40% at 100% 50%, rgba(14,165,233,0.15), transparent)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgb(2_6_23))]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-10"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 group-hover:border-slate-500 transition">
              ←
            </span>
            Volver al juego
          </button>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 tracking-wide uppercase">
                Quiz geográfico · Mapa en vivo
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1]">
                GeoChallenge
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
                Identifica países, capitales, ríos, provincias y accidentes geográficos haciendo
                clic en el lugar correcto sobre un mapa interactivo.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 text-sm shadow-lg shadow-blue-900/40 transition"
                >
                  Jugar ahora
                </button>
                <button
                  type="button"
                  onClick={onPrivacy}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 text-slate-200 font-medium px-5 py-2.5 text-sm transition"
                >
                  Privacidad
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/5 blur-2xl" />
              <img
                src="/og-image.png"
                alt="GeoChallenge — juego de geografía sobre un mapa"
                width={1200}
                height={630}
                className="relative w-full rounded-2xl shadow-2xl shadow-black/50 border border-white/10 object-cover ring-1 ring-white/5"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16 pb-28">
        {/* Cómo se juega */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
                Mecánica
              </p>
              <h2 className="text-2xl font-bold text-white">Cómo se juega</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                t: 'Temática y dificultad',
                d: 'Elige una o varias temáticas y nivel 1–5. Cada ronda genera preguntas aleatorias.',
              },
              {
                t: 'Modo preciso',
                d: 'Acierto si el clic cae dentro de la tolerancia del lugar (más estricto en niveles altos).',
              },
              {
                t: 'Modo distancia',
                d: 'Más puntos cuanto más cerca estés. La distancia real se muestra en kilómetros.',
              },
              {
                t: '15 segundos',
                d: 'Cuenta atrás por pregunta. Si se agota el tiempo, no podrás guardar el récord.',
              },
              {
                t: 'Feedback en mapa',
                d: 'Tras responder se resalta la geometría correcta, tu clic y el zoom a ambos puntos.',
              },
              {
                t: 'Ranking top 100',
                d: 'Solo las 100 mejores puntuaciones se conservan en Cloudflare D1.',
              },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-600 transition"
              >
                <h3 className="font-semibold text-white mb-2">{item.t}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Temáticas */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
            Contenido
          </p>
          <h2 className="text-2xl font-bold text-white mb-6">Temáticas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {THEMES.map((th) => (
              <div
                key={th.label}
                className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-center hover:border-blue-500/40 transition"
              >
                <div className="text-2xl mb-2" aria-hidden>
                  {th.icon}
                </div>
                <div className="font-semibold text-white text-sm">{th.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">{th.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Usuarios */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
            Acceso
          </p>
          <h2 className="text-2xl font-bold text-white mb-6">Usuarios y límites</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 rounded-full blur-3xl" />
              <div className="relative">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Invitado
                </span>
                <h3 className="text-xl font-bold text-white mb-3">Hasta 5 partidas / día</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-slate-600">▹</span>
                    Ranking como «Anónimo»
                  </li>
                  <li className="flex gap-2">
                    <span className="text-slate-600">▹</span>
                    Todas las temáticas y modos
                  </li>
                  <li className="flex gap-2">
                    <span className="text-slate-600">▹</span>
                    Sin registro obligatorio
                  </li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/80 to-slate-900 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2">
                  Registrado · Clerk
                </span>
                <h3 className="text-xl font-bold text-white mb-3">Sin límite de partidas</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2">
                    <span className="text-blue-400">▹</span>
                    Nombre personalizable en el ranking
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">▹</span>
                    Mismas reglas de tiempo (15 s)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">▹</span>
                    Cuenta segura con Clerk
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed max-w-2xl">
            Si alguna pregunta supera los 15 segundos, la partida se marca y no se puede enviar al
            ranking (evita trampas por pausas excesivas).
          </p>
        </section>

        {/* Stack */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
            Tecnología
          </p>
          <h2 className="text-2xl font-bold text-white mb-6">Stack</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {STACK.map((s) => (
              <div
                key={s.title}
                className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-300">
                  {s.title.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{s.title}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{s.items}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Autor */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
                Autor
              </p>
              <h2 className="text-2xl font-bold text-white">Aitor Sánchez Gutiérrez</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md">
                Desarrollo de aplicaciones web, herramientas online y blog.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href="https://aitorsanchez.pages.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:text-white transition"
                >
                  Blog
                </a>
                <a
                  href="https://aitorhub.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:text-white transition"
                >
                  Aitor Hub
                </a>
                <a
                  href="https://aitorsanchez.pages.dev/contacto/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:text-white transition"
                >
                  Contacto
                </a>
                <button
                  type="button"
                  onClick={onPrivacy}
                  className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:text-white transition"
                >
                  Privacidad
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 rounded-xl bg-white text-slate-900 font-semibold px-6 py-3 text-sm hover:bg-slate-100 transition shadow-lg"
            >
              Empezar a jugar →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
