interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <div className="min-h-full w-full overflow-y-auto bg-slate-50">
      <article className="max-w-3xl mx-auto px-4 py-8 pb-24 text-sm text-slate-700 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline mb-6 block"
        >
          ← Volver
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mt-2">Política de Privacidad</h1>
        <p className="text-slate-500">Última actualización: 25/11/2026</p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">1. Responsable del tratamiento</h2>
        <p>
          El responsable del tratamiento de los datos personales es:
          <br />
          <strong>Aitor Sánchez Gutiérrez</strong>
          <br />
          Correo:{' '}
          <a href="mailto:blog.cottage627@passinbox.com">blog.cottage627@passinbox.com</a>
          <br />
          Sitio web:{' '}
          <a href="https://aitorsanchez.pages.dev/contacto" target="_blank" rel="noopener noreferrer">
            https://aitorsanchez.pages.dev/contacto
          </a>
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">2. Datos que recogemos</h2>
        <p>
          Cuando visitas este sitio web, se recoge la siguiente información mediante el script de
          analítica privada alojado en Cloudflare Workers:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Dirección IP</li>
          <li>Navegador y sistema operativo (extraídos del User-Agent)</li>
          <li>URL de la página visitada</li>
          <li>Fecha y hora de la visita / última actividad</li>
          <li>
            Identificador de sesión generado a partir de un hash (SHA-256 de{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">app_id + IP + User-Agent</code>)
          </li>
        </ul>
        <p>
          No se recogen nombres, correos electrónicos, datos de formularios ni ninguna otra
          información identificativa directa, salvo que el usuario la facilite voluntariamente a
          través del registro (Clerk) o del nombre en el ranking, o por formularios de contacto u
          otros medios.
        </p>
        <p>
          El ranking de puntuaciones almacena en Cloudflare D1: nombre mostrado (o «Anónimo»), modo
          de juego, dificultad, temáticas, puntuación y, si estás registrado, un identificador de
          usuario de Clerk.
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">3. Finalidad del tratamiento</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Elaborar estadísticas de uso del sitio (visitas, páginas, navegadores, sistemas
            operativos y países de origen).
          </li>
          <li>Detectar y prevenir abusos o usos indebidos.</li>
          <li>Mejorar el funcionamiento y la experiencia del sitio.</li>
          <li>Mostrar un ranking de las mejores partidas.</li>
        </ul>
        <p>No se utilizan con fines publicitarios ni se venden a terceros.</p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">4. Base legal</h2>
        <p>
          El tratamiento se basa en el <strong>interés legítimo</strong> del responsable (artículo
          6.1.f del RGPD) para conocer el uso de su sitio web y mejorar el servicio, siempre que no
          prevalezcan los derechos e intereses del interesado. El registro con Clerk y el nombre en
          el ranking se basan en el consentimiento y/o la ejecución de la relación de usuario al
          utilizar esas funciones.
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">5. Conservación de los datos</h2>
        <p>
          Los datos de visitas se conservan durante el tiempo necesario para cumplir las finalidades
          descritas y, como máximo, <strong>24 meses</strong> desde la última actividad registrada.
          Las puntuaciones del ranking pueden conservarse mientras el servicio esté activo o hasta
          que solicites su supresión.
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">6. Destinatarios y encargados del tratamiento</h2>
        <p>
          Los datos se almacenan y procesan en la infraestructura de <strong>Cloudflare, Inc.</strong>{' '}
          (Pages, Workers y D1) y, si usas el registro, en <strong>Clerk</strong>, que actúan como
          encargados del tratamiento con garantías adecuadas conforme al RGPD.
        </p>
        <p>No se ceden datos a otros terceros, salvo obligación legal.</p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">7. Transferencias internacionales</h2>
        <p>
          Cloudflare y Clerk pueden procesar datos en Estados Unidos y otros países. Las
          transferencias se realizan con las garantías previstas en el RGPD (Cláusulas Contractuales
          Tipo y medidas complementarias).
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">8. Derechos de los interesados</h2>
        <p>Puedes ejercer en cualquier momento: acceso, rectificación, supresión, limitación,
          oposición y portabilidad.</p>
        <p>
          Envía un correo a{' '}
          <a href="mailto:blog.cottage627@passinbox.com">blog.cottage627@passinbox.com</a>{' '}
          indicando el derecho que deseas ejercer. También puedes reclamar ante la{' '}
          <a href="https://www.aepd.es/" target="_blank" rel="noopener noreferrer">
            AEPD
          </a>
          .
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">9. Cookies y tecnologías similares</h2>
        <p>
          Este sitio utiliza un script de seguimiento propio cargado desde el dominio del panel de
          analítica. No instala cookies de terceros ni realiza seguimiento publicitario. Clerk puede
          usar almacenamiento local/sesión para mantener el inicio de sesión.
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">10. Seguridad</h2>
        <p>
          Se aplican medidas técnicas y organizativas adecuadas (HTTPS, API con validación, sentencias
          preparadas en D1, límites de partidas anónimas, etc.).
        </p>

        <h2 className="text-lg font-semibold text-slate-800 pt-4">11. Cambios en la política</h2>
        <p>
          Podemos modificar esta política para adaptarla a cambios legislativos o de funcionamiento.
          La versión actualizada se publicará en esta página con la fecha de revisión.
        </p>
      </article>
    </div>
  );
}
