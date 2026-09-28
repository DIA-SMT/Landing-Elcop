import { notFound, redirect } from "next/navigation";

import { RUTA_INGRESO, hayUsuario, sesionDeAdmin } from "@/lib/admin/sesion";

// La sesión vive en una cookie: nada de esto se prerenderiza.
export const dynamic = "force-dynamic";

/**
 * La puerta del admin. Hoy hay una sola sección, así que manda derecho a
 * contenido; cuando exista la Etapa B, acá se elige a dónde ir según permisos.
 *
 * **Sin rol es un 404, no un 403** — mismo razonamiento que /comite: a quien
 * no corresponde, la ruta ni le confirma que existe.
 */
export default async function PaginaAdmin() {
  const sesion = await sesionDeAdmin();
  if (!sesion) {
    // Con usuario pero sin fila en `staff` es un 404; sin usuario, al ingreso.
    if (await hayUsuario()) notFound();
    redirect(RUTA_INGRESO);
  }

  if (sesion.permisos.contenido) redirect("/admin/contenido");

  // Staff sin permiso de contenido: cuando exista postulaciones irá ahí.
  notFound();
}
