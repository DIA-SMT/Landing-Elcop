import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";

import { FranjaInstitucional } from "@/components/layout/FranjaInstitucional";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ESCUELA } from "@/content/elcop";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

// Poppins no es fuente variable en Google Fonts: hay que pedir los pesos.
// Estos cuatro cubren todo lo que usa el sistema; no agregues más sin
// necesidad, cada peso es un archivo que el usuario descarga.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: `${ESCUELA.nombreCorto} — ${ESCUELA.nombre}`,
    template: `%s — ${ESCUELA.nombreCorto}`
  },
  description:
    "La Escuela de Liderazgo y Comunicación Política une la academia con el propósito cívico para capacitar a la próxima generación de dirigentes de San Miguel de Tucumán.",
  applicationName: ESCUELA.nombreCorto,
  authors: [{ name: "Municipalidad de San Miguel de Tucumán" }, { name: "UNSTA" }],
  openGraph: {
    title: `${ESCUELA.nombreCorto} — ${ESCUELA.nombre}`,
    description:
      "Diplomatura en Liderazgo y Comunicación Política. Beca del 100% para las personas seleccionadas.",
    locale: "es_AR",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0166FF"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen">
        {/* Primer tabulador de la página: quien navega con teclado se saltea
            el menú y cae directo en el contenido. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-municipal-700 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
        >
          Saltar al contenido
        </a>
        <FranjaInstitucional />
        <Header />
        <main id="contenido">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
