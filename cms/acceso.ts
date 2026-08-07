import type { Access } from "payload";

/**
 * Roles del sistema.
 *
 * - `admin`   — dirección. Todo.
 * - `staff`   — coordinación. Contenido y postulaciones.
 * - `becario` — sólo lo suyo dentro del portal. Sin acceso al panel de contenido.
 *
 * No hay registro público: las cuentas de becario se crean a partir de las
 * postulaciones marcadas como seleccionadas. Que el conjunto de usuarios sea
 * cerrado es una propiedad de seguridad que conviene conservar.
 */
export type Rol = "admin" | "staff" | "becario";

type UsuarioConRol = { rol?: Rol } | null | undefined;

const tieneRol = (usuario: UsuarioConRol, ...roles: Rol[]): boolean =>
  Boolean(usuario?.rol && roles.includes(usuario.rol));

/** Cualquiera, sin sesión. Es lo que hace público al sitio. */
export const cualquiera: Access = () => true;

/** Dirección solamente. */
export const soloAdmin: Access = ({ req }) => tieneRol(req.user as UsuarioConRol, "admin");

/** Dirección y coordinación: quienes editan el sitio. */
export const equipoElcop: Access = ({ req }) =>
  tieneRol(req.user as UsuarioConRol, "admin", "staff");

/** Cualquier persona con sesión iniciada, incluidos los becarios. */
export const conSesion: Access = ({ req }) => Boolean(req.user);

/**
 * El becario sólo alcanza sus propios registros; el equipo, todos.
 *
 * Devuelve una consulta en vez de un booleano: así Payload la aplica también
 * en los listados, y un becario nunca ve en una lista algo que no le
 * corresponde.
 */
export const propioOEquipo =
  (campo = "becario"): Access =>
  ({ req }) => {
    const usuario = req.user as (UsuarioConRol & { id?: string | number }) | null;
    if (!usuario) return false;
    if (tieneRol(usuario, "admin", "staff")) return true;
    return { [campo]: { equals: usuario.id } };
  };
