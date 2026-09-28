import type { Metadata } from "next";

import { exigirAdmin } from "@/lib/admin/sesion";
import { MarcoAdmin } from "@/components/admin/MarcoAdmin";
import { FormularioPublicacion } from "@/components/admin/FormularioPublicacion";

export const metadata: Metadata = { title: "Nueva publicación — Administración" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevaPublicacion() {
  await exigirAdmin("contenido");

  return (
    <MarcoAdmin
      titulo="Nueva publicación"
      volverA={{ href: "/admin/contenido", etiqueta: "Volver a publicaciones" }}
    >
      <FormularioPublicacion />
    </MarcoAdmin>
  );
}
