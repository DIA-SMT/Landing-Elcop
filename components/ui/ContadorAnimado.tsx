"use client";

import { useEffect, useRef, useState } from "react";

import { formatearNumero } from "@/content/elcop";
import { prefiereMovimientoReducido } from "@/components/ui/Reveal";

type Props = {
  valor: number;
  sufijo?: string;
  /** Duración del conteo en milisegundos. */
  duracion?: number;
};

/**
 * Cuenta desde 0 hasta `valor` cuando el número entra en viewport.
 *
 * Con movimiento reducido muestra el número final de una y no arranca ningún
 * bucle de animación. El valor definitivo va además en el DOM desde el
 * servidor, así que quien tenga JavaScript deshabilitado lee el número igual.
 */
export function ContadorAnimado({ valor, sufijo = "", duracion = 1400 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [actual, setActual] = useState(valor);

  useEffect(() => {
    if (prefiereMovimientoReducido()) return;
    const nodo = ref.current;
    if (!nodo) return;

    setActual(0);
    let cuadro = 0;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0]?.isIntersecting) return;
        observador.disconnect();

        const inicio = performance.now();
        const animar = (ahora: number) => {
          const avance = Math.min((ahora - inicio) / duracion, 1);
          // Misma curva `out` que el resto del sistema: arranca rápido, frena.
          const suavizado = 1 - Math.pow(1 - avance, 3);
          setActual(Math.round(valor * suavizado));
          if (avance < 1) cuadro = requestAnimationFrame(animar);
        };
        cuadro = requestAnimationFrame(animar);
      },
      { threshold: 0.4 }
    );
    observador.observe(nodo);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [valor, duracion]);

  return (
    <span ref={ref} className="tabular-nums">
      {/* El número accesible es siempre el final: el lector de pantalla no
          tiene por qué escuchar el conteo intermedio. */}
      <span aria-hidden="true">
        {formatearNumero(actual)}
        {sufijo}
      </span>
      <span className="sr-only">
        {formatearNumero(valor)}
        {sufijo}
      </span>
    </span>
  );
}
