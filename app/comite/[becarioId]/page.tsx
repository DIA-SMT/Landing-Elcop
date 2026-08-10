import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DetalleEntrega } from "@/components/comite/DetalleEntrega";
import { MarcoComite } from "@/components/comite/MarcoComite";
import { entregasDeLaCohorte } from "@/lib/portal/datos";
import { puedeVerTodasLasEntregas } from "@/lib/portal/roles";
import { obtenerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Proyecto final — Comité académico",
  description: "Lectura de un proyecto final de la cohorte."
};

export const dynamic = "force-dynamic";

/**
 * Un proyecto final, para leerlo y devolverlo con observaciones.
 *
 * La entrega se busca en el listado de la cohorte y no por `becarioId` directo:
 * así el permiso de ver esta entrega es exactamente el mismo que el de ver el
 * listado, y no hay una segunda regla que pueda quedar desalineada.
 */
export default async function PaginaEntregaDelComite({
  params
}: {
  params: { becarioId: string };
}) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");
  if (!puedeVerTodasLasEntregas(sesion.documento)) notFound();

  const becarioId = decodeURIComponent(params.becarioId);
  const entregas = await entregasDeLaCohorte();
  const fila = entregas.find((e) => e.becarioId === becarioId);
  if (!fila) notFound();

  return (
    <MarcoComite
      titulo={fila.entrega.titulo || "Proyecto sin título"}
      volverA={{ href: "/comite", etiqueta: "Volver a los proyectos" }}
    >
      <DetalleEntrega becarioId={fila.becarioId} nombre={fila.nombre} entrega={fila.entrega} />
    </MarcoComite>
  );
}
