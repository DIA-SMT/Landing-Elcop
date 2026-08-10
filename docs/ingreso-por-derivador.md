# Variante de ingreso: por Derivador

Segundo camino para que un becario entre al portal, **preparado y sin abrir**.
El primero es [`pr-cidituc.md`](pr-cidituc.md), por el derivador de CiDiTuc.

**Rama lista:** `elcop-portal-becario` en
`repo para login cidituc/derivador`, commit `d349138`, sobre `origin/dev`.
**Sin pushear** — se decide después de hablar con Agustín (ver §4).

---

## 1. De dónde sale

Agustín Brito integró UrbanIA así en el PR #96 de `derivador`, **ya mergeado en
`dev`** (`f0bb725 Habilita autenticacion de UrbanIA mediante Derivador`). Que
esté mergeado es el dato importante: es un camino que DITEC ya aceptó.

Nuestra rama replica ese flujo para ELCOP.

## 2. Cómo funciona

1. El portal manda a la persona a `<derivador>/#/login?next=elcop`.
2. Escribe sus credenciales **en Derivador**.
3. Derivador hace `POST /usuarios/login` y, si sale bien, redirige a
   `VITE_APP_ELCOP_CALLBACK_URL` con el token en `auth` —y con `state`, si vino—.
4. Nuestro callback hace lo mismo que siempre: consulta el perfil, comprueba el
   padrón y firma nuestra cookie.

**Nuestro código no cambia.** Los dos caminos entregan `?auth=<token>` al mismo
callback, y los dos frontends pegan al mismo backend (`cidituc-backend`,
`/usuarios/login`): la identidad es idéntica.

## 3. Los dos caminos, comparados

| | Por CiDiTuc | Por Derivador |
|---|---|---|
| Repo | `cidituc` | `derivador` |
| Estado | rama pusheada, PR sin abrir | rama local, sin pushear |
| Precedente | `hub-ia` | **UrbanIA, PR #96 mergeado** |
| Pantalla de login | la oficial de Ciudadano Digital | la de Derivador |
| URL de vuelta | **hardcodeada** en su código | **variable de entorno** |
| Cambiar de dominio | exige un despliegue de DITEC | no exige nada de ellos |
| `state` | CiDiTuc lo descarta | soportado |
| Sesión previa | reutiliza el token existente | fuerza credenciales cada vez |

Lo que gana el camino por Derivador: la URL como variable de entorno **resuelve
el costo que teníamos anotado** —pasar de `landing-elcop.vercel.app` a
`elcop.smt.gob.ar` no necesitaría un segundo despliegue de ellos—, el `state`
permite devolver a la persona a la pantalla que pidió, y forzar credenciales es
más prudente para un portal con datos personales.

Lo que pierde: **los becarios son ciudadanos**, y la puerta que reconocen es la
de Ciudadano Digital. Derivador se parece más a un lanzador interno —reclamos,
libre deuda, licitaciones, patrimonio—.

## 4. La decisión, y por qué no está tomada

**Hay que preguntarle a Agustín por qué eligió Derivador.** Si DITEC lo mandó por
ahí —por ejemplo, porque no quieren más ramas en el `if/else` de
`PrivateRoute.jsx`—, hay que seguirlo. Si fue conveniencia, el camino por CiDiTuc
es mejor para becarios.

Y hay algo social: nuestra rama **toca el código que él acaba de mergear**. En
vez de duplicar su bloque, las aplicaciones externas pasan a una tabla, así sumar
una es agregar una entrada. Es mejor ingeniería —evita repetir en Derivador la
cadena de `if/else` que ya creció en `cidituc`— pero conviene avisarle antes de
abrir el PR, no después.

## 5. Qué se probó

Con el servidor de desarrollo de Derivador, en `/#/login`:

- `next=elcop` → borra el token del navegador: la app externa se reconoce.
- `next=urbania` → igual que antes. **Sin regresión** en lo de Agustín.
- `next=constructor` → **no** se toma por aplicación válida. Con un objeto
  literal habría devuelto algo heredado del prototipo; por eso es un `Map`.
- Lint y `npm run build` sin errores.

No se probó el login completo, porque hace falta una credencial real.

## 6. Detalle que cuesta una tarde

**Derivador usa `HashRouter`**, así que la ruta va después del `#`:
`/#/login?next=elcop`. Sin el `#`, el router no ve `/login`, cae en la ruta
comodín, `getAuth()` no encuentra token y **te expulsa a
`ciudaddigital.smt.gob.ar`** —lo que parece que la pantalla no existiera—. Es lo
mismo que ya nos pasaba con `NEXT_PUBLIC_CIDITUC_LOGIN_URL`, que va entre
comillas justamente porque termina en `#/login`.

## 7. Si se elige este camino

1. Avisarle a Agustín, y recién después pushear la rama y abrir el PR contra
   `dev` (no contra `master`: en `derivador` la rama de integración es `dev`).
2. Pedir que configuren `VITE_APP_ELCOP_CALLBACK_URL` en el entorno de Derivador
   —en producción, `https://landing-elcop.vercel.app/auth/cidituc/callback`—.
3. Apuntar `NEXT_PUBLIC_CIDITUC_LOGIN_URL` de este proyecto al Derivador, con el
   `#`, y `NEXT_PUBLIC_CIDITUC_APP_ID=elcop`.
4. Cerrar el PR de `cidituc` si se descarta ese camino.
5. **El certificado sigue bloqueando igual.** Es independiente del camino que se
   elija: ver `PENDIENTES.md` §1 bis.
