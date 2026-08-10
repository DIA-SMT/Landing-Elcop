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
      <FormularioPostulacion />
      <Faq />
      {/* Sólo en las páginas públicas, y diferido: ver ChatDiferido. */}
      <ChatDiferido />
    </>
  );
}
