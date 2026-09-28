import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormularioIngreso } from "@/components/admin/FormularioIngreso";
import { ESCUELA } from "@/content/elcop";
import { sesionDeAdmin } from "@/lib/admin/sesion";

// Lee cookies para saber si ya hay sesión: nada de esto se prerenderiza.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ingreso al panel",
  // El panel no tiene por qué aparecer en buscadores.
  robots: { index: false, follow: false }
};

/**
 * Ingreso al panel de administración.
 *
 * Es la única pantalla del admin que se ve sin sesión, y por eso es la única
 * que no responde 404: existe para que alguien pueda entrar.
 */
export default async function PaginaIngresoAdmin() {
  // Si ya entró y es staff, no tiene sentido pedirle la contraseña otra vez.
  if (await sesionDeAdmin()) redirect("/admin");

  return (
    <div className="page-shell py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="section-kicker">Administración · {ESCUELA.cohorte}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
          Panel de contenidos
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Ingresá con la cuenta que te dieron para administrar las publicaciones de {ESCUELA.nombreCorto}.
        </p>
      </div>

      <div className="mt-8">
        <FormularioIngreso />
      </div>
    </div>
  );
}
