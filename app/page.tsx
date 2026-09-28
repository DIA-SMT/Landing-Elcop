import { Hero } from "@/components/home/Hero";
import { Indicadores } from "@/components/home/Indicadores";
import { Institucional } from "@/components/home/Institucional";
import { Equipo } from "@/components/home/Equipo";
import { Formacion } from "@/components/home/Formacion";
import { Referentes } from "@/components/home/Referentes";
import { Inscripciones } from "@/components/home/Inscripciones";
import { FormularioPostulacion } from "@/components/home/FormularioPostulacion";
import { Faq } from "@/components/home/Faq";
import { ChatDiferido } from "@/components/chat/ChatDiferido";
import { convocatoriaAbierta } from "@/lib/convocatoria";

export default function PaginaInicio() {
  return (
    <>
      <Hero />
      <Indicadores />
      <Institucional />
      <Equipo />
      <Formacion />
      <Referentes />
      <Inscripciones />
      {/* El estado de la convocatoria se resuelve en el servidor: es una
          variable de entorno, no algo que el navegador pueda cambiar. */}
      <FormularioPostulacion abierta={convocatoriaAbierta()} />
      <Faq />
      {/* Sólo en las páginas públicas, y diferido: ver ChatDiferido. */}
      <ChatDiferido />
    </>
  );
}
