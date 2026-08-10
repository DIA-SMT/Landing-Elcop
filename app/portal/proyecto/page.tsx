import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarcoPortal } from "@/components/portal/MarcoPortal";
import { ProyectoFinal } from "@/components/portal/ProyectoFinal";
import { datosDelPortal, fechaLimiteEntrega } from "@/lib/portal/datos";
import { obtenerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Proyecto final",
  description: "Entrega del proyecto final de la diplomatura."
};

// La sesión vive en una cookie: esta página no puede prerenderizarse.
export const dynamic = "force-dynamic";

export default async function PaginaProyecto() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");

  const [datos, fechaLimite] = await Promise.all([
    datosDelPortal(sesion.becarioId),
    fechaLimiteEntrega()
  ]);

  return (
    <MarcoPortal activa="proyecto" nombre={sesion.nombre || "becario"}>
      <ProyectoFinal
        entrega={datos.entrega}
        fechaLimite={fechaLimite}
        esDemostracion={datos.esDemostracion}
      />
    </MarcoPortal>
  );
}
