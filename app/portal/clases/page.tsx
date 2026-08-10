import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarcoPortal } from "@/components/portal/MarcoPortal";
import { MisClases } from "@/components/portal/MisClases";
import { agruparPorModulo } from "@/lib/portal/calculos";
import { datosDelPortal } from "@/lib/portal/datos";
import { obtenerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mis clases",
  description: "Encuentros y materiales de la cursada."
};

// La sesión vive en una cookie: esta página no puede prerenderizarse.
export const dynamic = "force-dynamic";

export default async function PaginaClases() {
  const sesion = await obtenerSesion();
  // Sin sesión no hay nada que mostrar: se vuelve a la puerta de entrada.
  if (!sesion) redirect("/portal");

  const datos = await datosDelPortal(sesion.becarioId);
  const modulos = agruparPorModulo(datos.encuentros, datos.materiales);

  return (
    <MarcoPortal activa="clases" nombre={sesion.nombre || "becario"}>
      <MisClases
        modulos={modulos}
        asistencias={datos.asistencias}
        esDemostracion={datos.esDemostracion}
      />
    </MarcoPortal>
  );
}
