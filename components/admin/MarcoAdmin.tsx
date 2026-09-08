import Link from "next/link";

import { ESCUELA } from "@/content/elcop";

/**
 * Armazón del admin. Mismo criterio que `MarcoComite`: no reusa el marco del
 * becario porque esa navegación no es la de quien administra. Cuando exista la
 * Etapa B (postulaciones), acá se suma su pestaña.
 */
export function MarcoAdmin({
  titulo,
  volverA,
  children
}: {
  titulo: string;
  volverA?: { href: string; etiqueta: string };
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        {volverA ? (
          <Link
            href={volverA.href}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-municipal-900 underline decoration-municipal-500/40 underline-offset-4 transition ease-out hover:decoration-municipal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">←</span>
            {volverA.etiqueta}
          </Link>
        ) : (
          <p className="section-kicker">Administración · {ESCUELA.cohorte}</p>
        )}

        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
            {titulo}
          </h1>
          <form action="/auth/cidituc/salir" method="post">
            <button type="submit" className="secondary-button">
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
