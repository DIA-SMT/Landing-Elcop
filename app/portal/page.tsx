import type { Metadata } from "next";
import Link from "next/link";

import { CONTACTO, ESCUELA } from "@/content/elcop";
import { urlDeIngreso } from "@/lib/cidituc";
import { obtenerSesion } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Portal del Becario",
  description: "Acceso de los becarios de ELCOP con Ciudadano Digital."
};

// La sesión vive en una cookie, así que esta página no puede prerenderizarse.
export const dynamic = "force-dynamic";

/**
 * Motivos por los que puede fallar el ingreso.
 *
 * Se distinguen porque llevan a acciones distintas: "no sos becario" no se
 * arregla reintentando, y "no pudimos consultar tus datos" sí. Un único mensaje
 * de "error al ingresar" mandaría a todo el mundo a insistir contra una puerta
 * que no se va a abrir.
 */
const MENSAJES: Record<string, { titulo: string; detalle: string }> = {
  "sin-token": {
    titulo: "No recibimos la respuesta de Ciudadano Digital",
    detalle: "Volvé a intentar el ingreso."
  },
  "token-invalido": {
    titulo: "La sesión de Ciudadano Digital no es válida o venció",
    detalle: "Iniciá sesión de nuevo."
  },
  "sin-perfil": {
    titulo: "No pudimos consultar tus datos en Ciudadano Digital",
    detalle:
      "Puede ser algo momentáneo de su servicio. Probá de nuevo en unos minutos; si sigue igual, escribinos."
  },
  "perfil-no-coincide": {
    titulo: "Los datos no coinciden",
    detalle: "Cerrá sesión en Ciudadano Digital y volvé a entrar."
  },
  "documento-invalido": {
    titulo: "No pudimos leer tu documento",
    detalle: "Revisá que tus datos estén completos en Ciudadano Digital."
  },
  "no-es-becario": {
    titulo: "Tu cuenta es válida, pero no figurás entre los becarios",
    detalle:
      "El portal es sólo para las personas seleccionadas. Si creés que es un error, puede ser que el documento de tu postulación no coincida con el de Ciudadano Digital."
  }
};

export default async function PaginaPortal({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const sesion = await obtenerSesion();
  const error = searchParams.error ? MENSAJES[searchParams.error] : undefined;

  if (sesion) {
    return (
      <section className="page-shell py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="section-kicker">{ESCUELA.cohorte}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
            Hola, {sesion.nombre || "becario"}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Ingresaste con Ciudadano Digital. El portal todavía está en construcción: acá van a
            estar tus clases, el material, las mentorías y la entrega del proyecto final.
          </p>

          <div className="mt-10 rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8">
            <p className="micro-label">Tu sesión</p>
            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm text-slate-600">Documento</dt>
                <dd className="text-sm font-bold text-ink">{sesion.documento}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm text-slate-600">Cohorte</dt>
                <dd className="text-sm font-bold text-ink">{ESCUELA.cohorte}</dd>
              </div>
            </dl>
          </div>

          <form action="/auth/cidituc/salir" method="post" className="mt-8">
            <button type="submit" className="secondary-button">
              Cerrar sesión
            </button>
          </form>
          <p className="mt-3 text-tiny text-slate-500">
            Cerrás sesión sólo en ELCOP. Tu sesión de Ciudadano Digital sigue abierta.
          </p>
        </div>
      </section>
    );
  }

  let enlaceDeIngreso: string | null = null;
  try {
    enlaceDeIngreso = urlDeIngreso("/portal");
  } catch {
    // Falta configurar la URL de CIDITUC. Se avisa en vez de romper la página.
    enlaceDeIngreso = null;
  }

  return (
    <section className="page-shell py-24 md:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brandYellow" />
          Portal del Becario
        </p>

        <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          Ingresá con Ciudadano Digital
        </h1>

        <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
          El portal es para las personas seleccionadas de la {ESCUELA.cohorte}. Se entra con la
          misma cuenta que usás para los demás servicios de la Municipalidad.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-left"
          >
            <p className="text-sm font-bold text-red-700">{error.titulo}</p>
            <p className="mt-1 text-sm leading-relaxed text-red-700">{error.detalle}</p>
            {CONTACTO.email && (
              <p className="mt-2 text-sm">
                <a href={`mailto:${CONTACTO.email}`} className="font-bold text-red-700 underline">
                  Escribinos
                </a>
              </p>
            )}
          </div>
        )}

        <div className="mt-10">
          {enlaceDeIngreso ? (
            <a href={enlaceDeIngreso} className="primary-button justify-center">
              Ingresar con Ciudadano Digital
              <span aria-hidden="true">→</span>
            </a>
          ) : (
            <span className="badge-soft">
              <i className="bg-slate-400" />
              Ingreso no configurado todavía
            </span>
          )}
        </div>

        <p className="mt-8 text-tiny leading-relaxed text-slate-500">
          Tu contraseña se escribe únicamente en el sitio de la Municipalidad. ELCOP no la recibe ni
          la guarda.
        </p>

        <div className="mt-12">
          <Link href="/" className="secondary-button">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
