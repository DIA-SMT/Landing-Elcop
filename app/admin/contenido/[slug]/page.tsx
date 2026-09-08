import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { publicacionesParaAdmin } from "@/lib/publicaciones";
import { permisosDeStaff } from "@/lib/staff";
import { obtenerSesion } from "@/lib/sesion";
import { MarcoAdmin } from "@/components/admin/MarcoAdmin";
import { FormularioPublicacion } from "@/components/admin/FormularioPublicacion";

export const metadata: Metadata = { title: "Editar publicación — Administración" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarPublicacion({
  params
}: {
  params: { slug: string };
}) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");
  if (!(await permisosDeStaff(sesion.documento))?.contenido) notFound();

  const slug = decodeURIComponent(params.slug);
  const publicacion = (await publicacionesParaAdmin()).find((p) => p.slug === slug);
  if (!publicacion) notFound();

  return (
    <MarcoAdmin
      titulo="Editar publicación"
      volverA={{ href: "/admin/contenido", etiqueta: "Volver a publicaciones" }}
    >
      <FormularioPublicacion
        slug={publicacion.slug}
        estado={publicacion.estado}
        inicial={{
          titulo: publicacion.titulo,
          bajada: publicacion.bajada,
          fecha: publicacion.fecha,
          categoria: publicacion.categoria,
          imagen: publicacion.imagen,
          imagenAlt: publicacion.imagenAlt
        }}
      />
    </MarcoAdmin>
  );
}
