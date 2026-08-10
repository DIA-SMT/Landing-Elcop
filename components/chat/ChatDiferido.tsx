"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Monta la burbuja del chat recién cuando el navegador queda libre.
 *
 * Está medido, no supuesto: con el widget montado desde el primer pintado, la
 * home pasaba de 99 a 91 en Performance de escritorio y de 95 a 87 en móvil, con
 * el bloqueo del hilo principal saltando de 0 a 180 ms. El chat no es contenido
 * crítico —nadie entra a la landing para hablar con el asistente— así que no
 * tiene por qué competir con el hero por el hilo ni por la red.
 *
 * Dos diferimientos, uno arriba del otro:
 *
 * 1. `dynamic` saca el código del widget del paquete inicial.
 * 2. El estado de abajo espera a que el navegador esté desocupado antes de
 *    pedirlo.
 *
 * Con `requestIdleCallback` cuando existe, y con un temporizador corto donde no
 * —Safari todavía no lo trae—.
 */

const BurbujaChat = dynamic(() => import("./BurbujaChat").then((m) => m.BurbujaChat), {
  ssr: false
});

export function ChatDiferido() {
  const [montar, setMontar] = useState(false);

  useEffect(() => {
    const conIdle = window.requestIdleCallback;
    if (conIdle) {
      // El `timeout` es el techo: si la página nunca se queda quieta, entra igual.
      const id = conIdle(() => setMontar(true), { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setMontar(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  if (!montar) return null;
  return <BurbujaChat />;
}
