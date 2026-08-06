import Image from "next/image";
import Link from "next/link";

import { CONTACTO, CO_BRANDING, DESARROLLO, ESCUELA, NAVEGACION, REDES } from "@/content/elcop";

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-black/5 bg-white">
      <div className="page-shell py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca y co-branding */}
          <div>
            <Image
              src="/logo-elcop.png"
              alt={`${ESCUELA.nombreCorto} — ${ESCUELA.nombre}`}
              width={1484}
              height={172}
              sizes="(min-width: 1024px) 320px, 260px"
              className="h-10 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
              Una iniciativa conjunta de la Municipalidad de San Miguel de Tucumán y la
              Universidad del Norte Santo Tomás de Aquino.
            </p>

            <h2 className="micro-label mt-8">Una iniciativa de</h2>
            <ul className="mt-3 flex flex-wrap items-center gap-4">
              {CO_BRANDING.map((marca) => (
                <li key={marca.nombre}>
                  <a
                    href={marca.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm transition ease-out hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
                  >
                    <Image
                      src={marca.src}
                      alt={marca.alt}
                      width={marca.ancho}
                      height={marca.alto}
                      sizes="140px"
                      className="h-9 w-auto"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navegación */}
          <nav aria-labelledby="pie-navegacion">
            <h2 id="pie-navegacion" className="micro-label">
              Navegación
            </h2>
            <ul className="mt-4 flex flex-col gap-1">
              {NAVEGACION.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 transition ease-out hover:text-municipal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
                  >
                    {item.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div>
            <h2 className="micro-label">Contacto</h2>
            <address className="mt-4 not-italic">
              <a
                href={CONTACTO.direccion.mapa}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 flex-col justify-center text-sm leading-relaxed text-slate-600 transition ease-out hover:text-municipal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
              >
                <span className="font-bold text-ink">{CONTACTO.direccion.institucion}</span>
                <span>{CONTACTO.direccion.calle}</span>
                <span>{CONTACTO.direccion.ciudad}</span>
              </a>
            </address>

            {/* Un dato que todavía no tenemos se muestra como pendiente, no en
                blanco: que se entienda que existe y falta cargarlo. */}
            <dl className="mt-5 flex flex-col gap-3 text-sm">
              <div>
                <dt className="micro-label">Email</dt>
                <dd className="mt-1">
                  {CONTACTO.email ? (
                    <a
                      href={`mailto:${CONTACTO.email}`}
                      className="font-semibold text-municipal-700 hover:underline"
                    >
                      {CONTACTO.email}
                    </a>
                  ) : (
                    <span className="badge-soft">
                      <i className="bg-slate-400" />A confirmar
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="micro-label">Teléfono</dt>
                <dd className="mt-1">
                  {CONTACTO.telefono ? (
                    <a
                      href={`tel:${CONTACTO.telefono.replace(/\s/g, "")}`}
                      className="font-semibold text-municipal-700 hover:underline"
                    >
                      {CONTACTO.telefono}
                    </a>
                  ) : (
                    <span className="badge-soft">
                      <i className="bg-slate-400" />A confirmar
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <h2 className="micro-label mt-6">Redes</h2>
            <ul className="mt-2 flex flex-wrap items-center gap-2">
              {REDES.map((red) =>
                red.href ? (
                  <li key={red.nombre}>
                    <a
                      href={red.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="secondary-button compact"
                    >
                      {red.nombre}
                    </a>
                  </li>
                ) : (
                  <li key={red.nombre}>
                    <span className="badge-soft">
                      <i className="bg-slate-400" />
                      {red.nombre}: a confirmar
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-tiny text-slate-500">
              © {anio} {ESCUELA.nombre}. {ESCUELA.socios}.
            </p>
            <p className="mt-1 text-tiny text-slate-500">
              Sitio en construcción: hay contenidos provisorios marcados como tales.
            </p>
          </div>

          <CreditoDesarrollo />
        </div>
      </div>
    </footer>
  );
}

/**
 * Crédito de quien construyó el sitio.
 *
 * Va más discreto que el co-branding de SMT y UNSTA de arriba: son jerarquías
 * distintas. El logo ya dice "Dirección de IA", así que el nombre completo
 * viaja en el texto alternativo y no se repite escrito al lado.
 */
function CreditoDesarrollo() {
  const contenido = (
    <>
      <span className="text-tiny text-slate-500">{DESARROLLO.etiqueta}</span>
      <Image
        src={DESARROLLO.logo.src}
        alt={`${DESARROLLO.nombre} — ${DESARROLLO.organismo}`}
        width={DESARROLLO.logo.ancho}
        height={DESARROLLO.logo.alto}
        sizes="140px"
        className="h-9 w-auto"
      />
    </>
  );

  // Todavía no sabemos si la Dirección tiene página propia: mientras no la
  // haya, el crédito no es un enlace en vez de llevar a ningún lado.
  if (!DESARROLLO.href) {
    return <p className="flex shrink-0 items-center gap-3">{contenido}</p>;
  }

  return (
    <a
      href={DESARROLLO.href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex shrink-0 items-center gap-3 rounded-xl transition ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
    >
      {contenido}
    </a>
  );
}
