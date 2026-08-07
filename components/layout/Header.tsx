"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ESCUELA, HERO, NAVEGACION } from "@/content/elcop";

/** Ids de las secciones de la home, en el mismo orden que el menú. */
const SECCIONES = ["inicio", "institucional", "formacion", "inscripciones"];

export function Header() {
  const pathname = usePathname();
  const enHome = pathname === "/";

  const [conSombra, setConSombra] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  // El panel se desmonta recién cuando termina la animación de salida: si
  // desaparece de golpe, se siente roto.
  const [cerrando, setCerrando] = useState(false);
  const menuMontado = menuAbierto || cerrando;

  const panelRef = useRef<HTMLDivElement>(null);
  const botonMenuRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  /* Dónde arranca el panel del menú. No es un valor fijo: arriba del header
     hay una franja institucional que no acompaña el scroll, así que el borde
     inferior del header vale 116px al entrar y 72px una vez que se scrolleó. */
  const [topeDelPanel, setTopeDelPanel] = useState(72);

  /* Sombra del header apenas se despega del tope de la página. */
  useEffect(() => {
    const alScrollear = () => setConSombra(window.scrollY > 8);
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  /* Marca en el menú la sección que se está mirando. Sólo en la home. */
  useEffect(() => {
    if (!enHome) {
      setSeccionActiva(null);
      return;
    }
    const nodos = SECCIONES.map((id) => document.getElementById(id)).filter(
      (nodo): nodo is HTMLElement => nodo !== null
    );
    if (nodos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setSeccionActiva(visible.target.id);
      },
      // La banda activa es el tercio superior de la ventana, descontando el header.
      { rootMargin: "-88px 0px -62% 0px", threshold: 0 }
    );
    nodos.forEach((nodo) => observador.observe(nodo));
    return () => observador.disconnect();
  }, [enHome]);

  const abrirMenu = useCallback(() => {
    // Se mide en el click, antes de renderizar, para que el panel no aparezca
    // un cuadro en la posición equivocada.
    setTopeDelPanel(headerRef.current?.getBoundingClientRect().bottom ?? 72);
    setCerrando(false);
    setMenuAbierto(true);
  }, []);

  // Sólo se llama con el menú abierto: desde el botón, desde un enlace del
  // panel o con Escape.
  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    setCerrando(true);
    botonMenuRef.current?.focus();
  }, []);

  /* Bloqueo del scroll de fondo y cierre con Escape mientras el menú está abierto. */
  useEffect(() => {
    if (!menuAbierto) return;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrarMenu();
    };
    // Si gira el teléfono con el menú abierto, el header cambia de alto.
    const alRedimensionar = () =>
      setTopeDelPanel(headerRef.current?.getBoundingClientRect().bottom ?? 72);

    document.addEventListener("keydown", alPresionar);
    window.addEventListener("resize", alRedimensionar);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alPresionar);
      window.removeEventListener("resize", alRedimensionar);
    };
  }, [menuAbierto, cerrarMenu]);

  /* Red de seguridad: si la animación de salida no llega a dispararse (una
     pestaña en segundo plano no corre animaciones), el panel se desmonta igual
     y no queda tapando la página. */
  useEffect(() => {
    if (!cerrando) return;
    const temporizador = window.setTimeout(() => setCerrando(false), 400);
    return () => window.clearTimeout(temporizador);
  }, [cerrando]);

  /* Cerrar el menú al cambiar de ruta, sin animación de salida. */
  useEffect(() => {
    setMenuAbierto(false);
    setCerrando(false);
  }, [pathname]);

  const esActivo = (href: string, tipo: "ancla" | "ruta") => {
    if (tipo === "ruta") return pathname === href || pathname.startsWith(`${href}/`);
    if (!enHome) return false;
    return href === `/#${seccionActiva}`;
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b bg-white transition ease-out ${
        conSombra ? "border-black/5 shadow-card" : "border-transparent"
      }`}
    >
      <div className="page-shell flex h-[72px] items-center justify-between gap-4 md:h-20">
        {/* El logo va sobre fondo blanco, sin recolorear ni deformar. */}
        <Link
          href="/"
          className="-m-2 shrink-0 rounded-xl p-2 transition ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
          aria-label={`${ESCUELA.nombreCorto}, ${ESCUELA.nombre} — ir al inicio`}
        >
          {/* Sin `priority`: precargar el lockup completo haría que en móvil se
              reserve ancho de banda para una imagen que ni siquiera se muestra.
              La precarga la lleva sólo la marca, que es la que se ve primero. */}
          <Image
            src="/logo-elcop.png"
            alt=""
            width={1484}
            height={172}
            sizes="(min-width: 1280px) 300px, 260px"
            className="hidden h-9 w-auto xl:block"
          />
          <Image
            src="/logo-elcop-marca.png"
            alt=""
            width={629}
            height={172}
            priority
            sizes="120px"
            className="h-7 w-auto sm:h-8 xl:hidden"
          />
        </Link>

        {/* Navegación de escritorio */}
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAVEGACION.map((item) => {
              const activo = esActivo(item.href, item.tipo);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={activo ? "page" : undefined}
                    // El activo va en municipal-900: sobre municipal-50, el 700
                    // se queda en 4,49:1, justo por debajo del mínimo.
                    className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2 ${
                      activo
                        ? "bg-municipal-50 text-municipal-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                    }`}
                  >
                    {item.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Se achica el padding en pantallas chicas, pero nunca el alto: el
              objetivo táctil se mantiene en 44px. */}
          <Link href={`/${HERO.ctaPrimario.href}`} className="primary-button px-4 text-xs sm:px-5 sm:text-sm">
            {HERO.ctaPrimario.etiqueta}
          </Link>

          <button
            ref={botonMenuRef}
            type="button"
            onClick={() => (menuAbierto ? cerrarMenu() : abrirMenu())}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            className="grid size-11 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2 lg:hidden"
          >
            <span className="sr-only">{menuAbierto ? "Cerrar menú" : "Abrir menú"}</span>
            <IconoMenu abierto={menuAbierto} />
          </button>
        </div>
      </div>

      {/* Menú móvil a pantalla completa */}
      {menuMontado && (
        <div
          id="menu-movil"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          onAnimationEnd={() => setCerrando(false)}
          style={{ top: topeDelPanel }}
          className={`fixed inset-x-0 bottom-0 z-40 bg-white outline-none lg:hidden ${
            cerrando ? "menu-movil-saliendo" : "animate-scale-in"
          }`}
        >
          <div className="page-shell flex h-full flex-col overflow-y-auto py-6">
            <nav aria-label="Principal (móvil)">
              <ul className="flex flex-col gap-1">
                {NAVEGACION.map((item) => {
                  const activo = esActivo(item.href, item.tipo);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={cerrarMenu}
                        aria-current={activo ? "page" : undefined}
                        className={`flex min-h-14 items-center justify-between rounded-2xl px-4 font-display text-lg font-bold transition ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2 ${
                          activo ? "bg-municipal-50 text-municipal-900" : "text-ink hover:bg-slate-50"
                        }`}
                      >
                        {item.etiqueta}
                        <span aria-hidden="true" className="text-slate-300">
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-auto pt-8">
              <Link
                href={`/${HERO.ctaPrimario.href}`}
                onClick={cerrarMenu}
                className="primary-button w-full justify-center"
              >
                {HERO.ctaPrimario.etiqueta}
              </Link>
              <p className="mt-4 text-center text-tiny text-slate-500">{ESCUELA.socios}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** Hamburguesa que se transforma en cruz. Anima sólo `transform` y `opacity`. */
function IconoMenu({ abierto }: { abierto: boolean }) {
  const base = "absolute h-0.5 w-5 rounded-full bg-current transition ease-out";
  return (
    <span aria-hidden="true" className="relative grid size-5 place-items-center">
      <span className={`${base} ${abierto ? "translate-y-0 rotate-45" : "-translate-y-1.5"}`} />
      <span className={`${base} ${abierto ? "opacity-0" : "opacity-100"}`} />
      <span className={`${base} ${abierto ? "translate-y-0 -rotate-45" : "translate-y-1.5"}`} />
    </span>
  );
}
