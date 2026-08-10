import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarcoPortal } from "@/components/portal/MarcoPortal";
import { Mentorias } from "@/components/portal/Mentorias";
import { datosDelPortal } from "@/lib/portal/datos";
import { obtenerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mentorías",
  description: "Consultas y sesiones de mentoría de la cursada."
};

// La sesión vive en una cookie: esta página no puede prerenderizarse.
export const dynamic = "force-dynamic";

export default async function PaginaMentorias() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");

  const datos = await datosDelPortal(sesion.becarioId);

  return (
    <MarcoPortal activa="mentorias" nombre={sesion.nombre || "becario"}>
      <Mentorias
        consultas={datos.consultas}
        sesiones={datos.sesionesMentoria}
        esDemostracion={datos.esDemostracion}
      />
    </MarcoPortal>
  );
}
