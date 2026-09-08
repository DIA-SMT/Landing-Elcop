import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { permisosDeStaff } from "@/lib/staff";
import { obtenerSesion } from "@/lib/sesion";
import { MarcoAdmin } from "@/components/admin/MarcoAdmin";
import { FormularioPublicacion } from "@/components/admin/FormularioPublicacion";

export const metadata: Metadata = { title: "Nueva publicación — Administración" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevaPublicacion() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");
  if (!(await permisosDeStaff(sesion.documento))?.contenido) notFound();

  return (
    <MarcoAdmin
      titulo="Nueva publicación"
      volverA={{ href: "/admin/contenido", etiqueta: "Volver a publicaciones" }}
    >
      <FormularioPublicacion />
    </MarcoAdmin>
  );
}
