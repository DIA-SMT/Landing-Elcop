import type { Access, FieldAccess } from "payload";

/**
 * Roles del sistema.
 *
 * - `admin`   — dirección. Todo.
 * - `staff`   — coordinación. Contenido, postulaciones y cursada.
 * - `docente` — disertante. Sólo el material que sube y los encuentros que dicta.
 * - `becario` — sólo lo suyo dentro del portal. Sin acceso al panel de contenido.
 *
 * No hay registro público: las cuentas de becario se crean a partir de las
 * postulaciones marcadas como seleccionadas, y las de docente las da de alta la
 * coordinación. Que el conjunto de usuarios sea cerrado es una propiedad de
 * seguridad que conviene conservar.
 */
export type Rol = "admin" | "staff" | "docente" | "becario";

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

/** Docentes y equipo. Es quien puede cargar material de clase. */
export const docenteOEquipo: Access = ({ req }) =>
  tieneRol(req.user as UsuarioConRol, "admin", "staff", "docente");

/**
 * El docente alcanza sólo lo que subió él; el equipo, todo. Los becarios leen
 * pero no escriben, así que esta regla se usa para crear, editar y borrar.
 *
 * Se filtra por quién subió el registro y no por el encuentro al que pertenece
 * porque una regla de acceso devuelve una consulta sobre los campos de esta
 * misma colección: para mirar el encuentro habría que hacer una subconsulta,
 * que acá no se puede.
 */
export const subidoPorMiOEquipo =
  (campo = "subidoPor"): Access =>
  ({ req }) => {
    const usuario = req.user as (UsuarioConRol & { id?: string | number }) | null;
    if (!usuario) return false;
    if (tieneRol(usuario, "admin", "staff")) return true;
    if (tieneRol(usuario, "docente")) return { [campo]: { equals: usuario.id } };
    return false;
  };

/** Cualquiera del portal: becarios, docentes y equipo. Nadie sin sesión. */
export const portal: Access = ({ req }) =>
  tieneRol(req.user as UsuarioConRol, "admin", "staff", "docente", "becario");

/**
 * Misma regla que `equipoElcop`, pero para permisos a nivel de campo.
 *
 * Payload usa dos tipos distintos: el acceso de colección puede devolver una
 * consulta para filtrar listados, y el de campo sólo un booleano —un campo se
 * ve o no se ve, no se filtra a medias—. Por eso hace falta esta versión y no
 * alcanza con reusar la de arriba.
 */
export const equipoElcopCampo: FieldAccess = ({ req }) =>
  tieneRol(req.user as UsuarioConRol, "admin", "staff");
