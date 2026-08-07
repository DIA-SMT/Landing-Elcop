import Image from "next/image";

import { FRANJA_INSTITUCIONAL } from "@/content/elcop";

/**
 * Franja institucional del municipio, arriba del header.
 *
 * No es pegajosa a propósito: se lee al entrar y después deja el lugar al
 * header de ELCOP, que sí acompaña el scroll. Blanco sobre `municipal-900`
 * da 10,7:1 de contraste.
 */
export function FranjaInstitucional() {
  const { institucion, institucionCorta, logo, sitio } = FRANJA_INSTITUCIONAL;

  return (
    <div className="bg-municipal-900 text-white">
      <div className="page-shell flex min-h-11 items-center justify-between gap-4">
        <p className="flex min-w-0 items-center gap-2.5">
          <Image
            src={logo.src}
            alt=""
            width={logo.ancho}
            height={logo.alto}
            sizes="80px"
            className="h-6 w-auto shrink-0"
          />
          <span className="truncate text-tiny font-semibold tracking-wide text-white">
            <span className="hidden sm:inline">{institucion}</span>
            <span className="sm:hidden">{institucionCorta}</span>
          </span>
        </p>

        <a
          href={sitio.href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-tiny font-bold text-white transition ease-out hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-municipal-900"
        >
          {sitio.etiqueta}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      </div>
    </div>
  );
}
