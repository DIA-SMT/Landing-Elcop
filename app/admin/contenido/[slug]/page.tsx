import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicacionesParaAdmin } from "@/lib/publicaciones";
import { exigirAdmin } from "@/lib/admin/sesion";
import { MarcoAdmin } from "@/components/admin/MarcoAdmin";
import { FormularioPublicacion } from "@/components/admin/FormularioPublicacion";

export const metadata: Metadata = { title: "Editar publicación — Administración" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarPublicacion({
  params
}: {
  params: { slug: string };
}) {
  await exigirAdmin("contenido");

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
