# Ingreso por Derivador — el camino elegido

**Decidido:** el ingreso al portal va por Derivador, como hizo Agustín con
UrbanIA. No es una preferencia de estilo; es el único de los dos caminos que
apunta al dominio que ya usamos. La razón está en §1.

Rama `elcop-portal-becario` **pusheada** a `ditec-desarrollo/derivador`, commit
`d349138`, sobre `dev`.

**Abrir el PR:**
<https://github.com/ditec-desarrollo/derivador/pull/new/elcop-portal-becario>

> **Base `dev`, no `master`.** En `derivador` la rama de integración es `dev`.

---

## 1. ⚠️ Los nombres de las carpetas engañan

Esto costó una tarde y conviene no volver a descubrirlo. **Verificado el 10 de
agosto de 2026** comparando los bundles desplegados, no deducido:

| Dominio | Lo sirve el repo | Cómo se comprobó |
|---|---|---|
| `cidituc.smt.gob.ar` | **`derivador`** | Su bundle trae `Libre Deuda`, `Combustibles` y `registrarAccesoExterno` |
| `ciudaddigital.smt.gob.ar` | **`cidituc`** | Su bundle trae `hub-ia`, `juventudyaccion`, `turno-castracion` |

Los títulos también están cruzados: el repo `cidituc` tiene
`<title>Ciudad Digital` y el repo `derivador`, `<title>CiDiTuc`. Y los dos
`package.json` se llaman `ditec-contable`.

**De acá sale la decisión.** Nuestro `NEXT_PUBLIC_CIDITUC_LOGIN_URL` es
`https://cidituc.smt.gob.ar/#/login`, que es **el Derivador**. El PR que
habíamos preparado en el repo `cidituc` se habría desplegado en
`ciudaddigital.smt.gob.ar`, un dominio al que no mandamos a nadie: no habría
funcionado sin además cambiar nuestra URL de ingreso.

### Y explica el síntoma que teníamos mal diagnosticado

[`registrar-elcop-en-cidituc.md`](registrar-elcop-en-cidituc.md) atribuía el
problema a que `next=elcop` caía en el `else` final de `PrivateRoute.jsx`. Era la
app equivocada. Lo que pasaba de verdad: en `cidituc.smt.gob.ar` el login es el
del Derivador, que **no tenía ningún soporte de `next`** hasta el PR #96 de
Agustín, así que después de autenticarse navegaba a `/home`. De ahí el "la
persona se autentica bien y termina en el derivador, sin ningún error".

El mecanismo de Agustín no es una alternativa: es el arreglo del síntoma real.

## 2. Cómo funciona

1. El portal manda a `https://cidituc.smt.gob.ar/#/login?next=elcop`.
2. La persona escribe sus credenciales en Derivador.
3. Derivador hace `POST /usuarios/login` y redirige a
   `VITE_APP_ELCOP_CALLBACK_URL` con el token en `auth` —y `state`, si vino—.
4. Nuestro callback consulta el perfil, comprueba el padrón y firma la cookie.

**Nuestro código no cambia, y tampoco la configuración.** Ya apuntamos a ese
dominio y `NEXT_PUBLIC_CIDITUC_APP_ID` ya es `elcop`. La variable sigue
llamándose `CIDITUC` con razón: la identidad es la misma —los dos frontends usan
el mismo `cidituc-backend` y el mismo `/usuarios/login`—; lo que cambia es qué
pantalla la pide.

## 3. Estado del despliegue

El PR #96 de Agustín está **mergeado en `dev` pero no desplegado**: el bundle de
`cidituc.smt.gob.ar` no contiene la cadena `urbania`. O sea que ni UrbanIA ni
ELCOP van a funcionar hasta que produccion se actualice. **Hay que preguntar cómo
y cuándo se despliega**, porque eso —y no el merge— es lo que destraba el
ingreso.

## 4. Texto para el PR

### Título

```
Habilita autenticacion de ELCOP mediante Derivador
```

### Descripción

Hola. Desde la Dirección de IA estamos construyendo el Portal del Becario de
ELCOP —la Escuela de Liderazgo y Comunicación Política, del convenio entre la
Municipalidad y la UNSTA— y el ingreso lo resolvemos con Ciudadano Digital.

Seguimos el flujo que sumó Agustín para UrbanIA en el PR #96: la persona llega a
`/#/login?next=elcop`, se autentica en Derivador y vuelve a la aplicación con el
token en `auth`.

**Una diferencia con ese PR, y la explico por si preferís que la revierta.** En
vez de duplicar el bloque de UrbanIA, las aplicaciones externas pasan a una
tabla: sumar una es agregar una entrada y su variable de entorno, sin tocar el
flujo del login. La idea es no repetir en Derivador la cadena de `if/else` que
fue creciendo en el `PrivateRoute.jsx` del otro repo, donde cada aplicación nueva
es una rama más. **El comportamiento de UrbanIA no cambia**: mismo callback,
mismo `state`, y el token del navegador se sigue borrando antes de redirigir.

Es un `Map` y no un objeto literal porque con un objeto un `next=constructor`
devuelve algo heredado del prototipo, y el flujo arrancaría con una configuración
inexistente.

**Probado** con el servidor de desarrollo, en `/#/login`: con `next=elcop` y con
`next=urbania` se borra el token del navegador; con un `next` desconocido o con
`next=constructor`, no se toca. Lint y build sin errores. El login completo no lo
probamos porque hace falta una credencial real.

**Lo que necesitamos de ustedes:**

1. Mergear y desplegar. Vimos que el PR #96 está en `dev` pero todavía no en
   producción —el bundle de `cidituc.smt.gob.ar` no trae la cadena de UrbanIA—,
   así que si hay un paso de despliegue aparte, nos sirve saber cuál es.
2. Configurar `VITE_APP_ELCOP_CALLBACK_URL` en el entorno de Derivador. En
   producción: `https://landing-elcop.vercel.app/auth/cidituc/callback`. Nuestro
   callback ya está publicado y funcionando.

### Un pedido aparte, que nos bloquea igual

`estadisticas.smt.gob.ar:5000` **envía sólo el certificado final, sin el
intermedio de la autoridad.** Verificado de nuevo hoy: manda un único
certificado, el de `*.smt.gob.ar` emitido por *Sectigo Public Server
Authentication CA DV R36*.

Los navegadores lo disimulan porque suelen tenerlo cacheado, pero Node falla con
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Nuestro backend consulta
`/usuarios/authStatus` desde Node para validar el token y traer el documento, así
que **con la cadena incompleta el ingreso no funciona en producción aunque este
PR se despliegue.**

Instalar la cadena completa en el servidor lo resuelve para todos los que
consuman ese backend. Si les resulta más cómodo, podemos cargar el intermedio de
nuestro lado; preferimos la primera.

### Otra cosa que vimos, sin urgencia

En `cidituc-backend`, `/usuarios/dni/:dni` y `/usuarios/email/:email` no pasan
por el middleware `auth`, y `/usuarios/registrarAccesoExterno` tampoco —siendo un
`POST` que inserta filas—. Vale la pena verificar si son alcanzables desde
afuera.

Gracias.

## 5. Qué se probó de nuestro lado

- `next=elcop` → borra el token del navegador: la app externa se reconoce.
- `next=urbania` → igual que antes. **Sin regresión** en lo de Agustín.
- `next=constructor` → **no** se toma por aplicación válida.
- Lint y `npm run build` sin errores.

## 6. Detalle que cuesta una tarde

**Derivador usa `HashRouter`**: la ruta va después del `#`. Sin él, el router no
ve `/login`, cae en la ruta comodín, `getAuth()` no encuentra token y **expulsa a
`ciudaddigital.smt.gob.ar`**, lo que se lee como si la pantalla no existiera. Es
por lo mismo que `NEXT_PUBLIC_CIDITUC_LOGIN_URL` va entre comillas en el `.env`.

## 7. Pendiente de este cambio

- **Avisarle a Agustín** antes de que lo vea por notificación: el PR toca el
  código que él acaba de mergear.
- ~~Borrar la rama del repo `cidituc`~~ **Hecho.** Apuntaba a la app equivocada y
  se borró del remoto; el commit `394bd46` sigue en el clon local por si alguna
  vez hiciera falta.
- **`state`**: Derivador lo reenvía y hoy nuestro callback lo ignora. Si se
  quiere usar para devolver a la persona a la pantalla que pidió, hay que
  validarlo como ruta interna —sólo un path que empiece con `/portal`, nunca una
  URL— o queda un redirector abierto.
