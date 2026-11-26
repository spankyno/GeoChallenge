interface FooterProps {
  onNavigate: (page: 'about' | 'privacy') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="pointer-events-auto absolute bottom-0 left-0 right-0 z-10 border-t border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="hover:text-slate-800 transition"
          >
            Acerca de
          </button>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <a
            href="https://aitorsanchez.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 transition"
          >
            Blog
          </a>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <a
            href="https://aitorhub.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 transition"
          >
            Aitor Hub
          </a>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <a
            href="https://aitorsanchez.pages.dev/contacto/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 transition"
          >
            Contacto
          </a>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className="hover:text-slate-800 transition"
          >
            Privacidad
          </button>
        </nav>
        <p className="text-[11px] text-slate-400">
          Autor: Aitor Sánchez Gutiérrez. © 2026 — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
