"use client";

import { useEffect, useRef, useState } from "react";

/** `true` si la persona pidió movimiento reducido a nivel sistema. */
export function prefiereMovimientoReducido(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  children: React.ReactNode;
  /** Retardo en milisegundos, para escalonar elementos de una misma fila. */
  retardo?: number;
  className?: string;
};

/**
 * Revela su contenido al entrar en viewport animando sólo `opacity` y
 * `transform`. Si hay movimiento reducido, monta ya visible y no observa nada.
 */
export function Reveal({ children, retardo = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefiereMovimientoReducido()) {
      setVisible(true);
      return;
    }
    const nodo = ref.current;
    if (!nodo) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      // Se dispara cuando el bloque asomó lo suficiente como para leerse.
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-visible={visible ? "true" : "false"}
      style={retardo ? { transitionDelay: `${retardo}ms` } : undefined}
    >
      {children}
    </div>
  );
}
