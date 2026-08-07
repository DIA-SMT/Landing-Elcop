"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { VIDEOS_HERO } from "@/content/elcop";
import { prefiereMovimientoReducido } from "@/components/ui/Reveal";

/** Segundos antes del final en que empieza la disolvencia con el siguiente. */
const CRUCE = 1.4;

/**
 * Fondo del hero: una portada fija con tres videos que se van cruzando encima.
 *
 * Es decoración, así que queda fuera del árbol de accesibilidad y no recibe
 * foco. Sólo se anima `opacity`.
 *
 * Los videos no se descargan siempre. Se saltean en celulares, con movimiento
 * reducido y con el ahorro de datos del navegador activado; en esos casos
 * queda la portada, que es una imagen de 58 KB.
 */
export function VideoFondoHero() {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [activo, setActivo] = useState(0);

  const refs = useRef<Array<HTMLVideoElement | null>>([]);
  // Evita que los muchos `timeupdate` por segundo disparen el cruce dos veces.
  const cambiando = useRef(false);

  useEffect(() => {
    // En celulares el fondo es la portada y nada más: no vale gastarle datos
    // a alguien para decorar.
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    if (prefiereMovimientoReducido()) return;

    const conexion = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (conexion?.saveData) return;

    // El video es decoración: espera a que el hero termine de pintar en vez de
    // competir con el primer render.
    const id = window.setTimeout(() => setReproduciendo(true), 700);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (reproduciendo) refs.current[0]?.play().catch(() => {});
  }, [reproduciendo]);

  /** Los que siguen se cargan recién cuando el primero ya está en marcha. */
  const alEmpezarElPrimero = useCallback(() => {
    window.setTimeout(() => {
      refs.current.slice(1).forEach((video) => video?.load());
    }, 1500);
  }, []);

  const alAvanzar = useCallback(
    (indice: number) => {
      if (indice !== activo || cambiando.current) return;
      const video = refs.current[indice];
      if (!video?.duration) return;
      if (video.duration - video.currentTime > CRUCE) return;

      cambiando.current = true;
      const siguiente = (indice + 1) % VIDEOS_HERO.length;
      const proximo = refs.current[siguiente];
      if (proximo) {
        proximo.currentTime = 0;
        proximo.play().catch(() => {});
      }
      setActivo(siguiente);
      window.setTimeout(() => {
        cambiando.current = false;
      }, CRUCE * 1000);
    },
    [activo]
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Portada: es la base de todo y lo único que se ve sin video. */}
      <Image
        src={VIDEOS_HERO[0].portada}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {reproduciendo &&
        VIDEOS_HERO.map((video, indice) => (
          <video
            key={video.id}
            ref={(el) => {
              refs.current[indice] = el;
            }}
            src={video.mp4}
            muted
            playsInline
            preload={indice === 0 ? "auto" : "none"}
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={indice === 0 ? alEmpezarElPrimero : undefined}
            onTimeUpdate={() => alAvanzar(indice)}
            // Red de seguridad: si un video termina sin que el cruce se haya
            // disparado, igual se pasa al siguiente y la rotación no se traba.
            onEnded={() => alAvanzar(indice)}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ease-out ${
              indice === activo ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
    </div>
  );
}
