import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portal del Becario",
  description: "El Portal del Becario de ELCOP está en desarrollo."
};

/**
 * Placeholder del Portal del Becario.
 *
 * El portal (login, dashboard, asistencia, repositorio de clases y carga del
 * proyecto final) queda fuera de esta iteración. Acá no hay autenticación
 * simulada a propósito: mostrar un login que no valida nada confunde más de lo
 * que ayuda.
 */
export default function PaginaPortal() {
  return (
    <section className="page-shell py-24 md:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brandYellow" />
          Portal del Becario
        </p>

        <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          Próximamente
        </h1>

        <div className="mt-10">
          <Link href="/" className="secondary-button">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
