import Link from "next/link";

import { ESCUELA } from "@/content/elcop";

/**
 * Armazón del Portal del Becario: la navegación lateral y el encabezado.
 *
 * Las cinco secciones son las del prototipo. Sólo el panel existe todavía; las
 * demás se muestran igual, marcadas como pendientes, porque esconderlas dejaría
 * a la persona sin saber qué va a poder hacer acá. Lo que no se hace es
 * enlazarlas a rutas que no existen.
 */

export type SeccionPortal = "panel" | "clases" | "mentorias" | "proyecto" | "beca";

const SECCIONES: { id: SeccionPortal; etiqueta: string; href: string | null }[] = [
  { id: "panel", etiqueta: "Panel", href: "/portal" },
  { id: "clases", etiqueta: "Mis clases", href: "/portal/clases" },
  { id: "mentorias", etiqueta: "Mentorías", href: null },
  { id: "proyecto", etiqueta: "Proyecto final", href: null },
  { id: "beca", etiqueta: "Mi beca", href: null }
];

type Props = {
  activa: SeccionPortal;
  nombre: string;
  children: React.ReactNode;
};

export function MarcoPortal({ activa, nombre, children }: Props) {
  return (
    <div className="page-shell py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <nav aria-label="Secciones del portal">
          <p className="micro-label">Portal del Becario</p>
          <ul className="mt-4 flex flex-col gap-1">
            {SECCIONES.map((seccion) => {
              const esActiva = seccion.id === activa;

              if (!seccion.href) {
                return (
                  <li key={seccion.id}>
                    {/* slate-500 y no 400: estas secciones no están activas, pero
                        sí tienen que poder leerse — dicen qué va a haber acá. */}
                    <span className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500">
                      {seccion.etiqueta}
                      <span className="text-micro font-extrabold uppercase tracking-wider text-slate-500">
                        Pronto
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={seccion.id}>
                  <Link
                    href={seccion.href}
                    aria-current={esActiva ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2 ${
                      esActiva
                        ? "bg-municipal-50 text-municipal-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                    }`}
                  >
                    {seccion.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>

          <form action="/auth/cidituc/salir" method="post" className="mt-8">
            {/* Sin `compact`: baja el alto a 40px y se cae del objetivo táctil. */}
            <button type="submit" className="secondary-button w-full justify-center">
              Cerrar sesión
            </button>
          </form>
        </nav>

        <div>
          <p className="section-kicker">{ESCUELA.cohorte}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
            Hola, {nombre}
          </h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
