import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ListaEntregas } from "@/components/comite/ListaEntregas";
import { MarcoComite } from "@/components/comite/MarcoComite";
import { entregasDeLaCohorte } from "@/lib/portal/datos";
import { puedeVerTodasLasEntregas } from "@/lib/portal/roles";
import { obtenerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Comité académico",
  description: "Proyectos finales de la cohorte."
};

// La sesión vive en una cookie: esta página no puede prerenderizarse.
export const dynamic = "force-dynamic";

/**
 * Listado de proyectos finales, para el comité académico.
 *
 * **Sin rol de comité es un 404, no un 403.** Un 403 le confirmaría a un becario
 * curioso que la ruta existe y que hay algo del otro lado; el 404 no le dice
 * nada. Para quien tiene el rol, la página funciona igual.
 */
export default async function PaginaComite() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");
  if (!puedeVerTodasLasEntregas(sesion.documento)) notFound();

  const entregas = await entregasDeLaCohorte();

  return (
    <MarcoComite titulo="Proyectos finales">
      <ListaEntregas
        entregas={entregas}
        esDemostracion={process.env.PORTAL_DATOS_DEMO === "true"}
      />
    </MarcoComite>
  );
}
