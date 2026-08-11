# Conectar tu aplicación al login de CIDITUC (Ciudadano Digital)

Guía de integración escrita por la Dirección de IA (Lucas Nahuz) a partir de la
integración de ELCOP, **probada en producción el 11/8/2026** con ingresos
reales. Está pensada para dársela a un asistente de IA como contexto: tiene los
pasos en orden, el código mínimo que funciona, y todas las trampas que nos
costaron horas, marcadas con ⚠️.

> **Para el asistente que implemente esto:** seguí los pasos en orden. Las
> advertencias ⚠️ no son teóricas: cada una es un error que ya ocurrió en una
> integración real. No "simplifiques" salteándolas.

---

## 1. Cómo funciona el flujo (2 minutos)

```
Tu app                          Derivador                     Backend CIDITUC
(tu dominio)                    cidituc.smt.gob.ar            estadisticas.smt.gob.ar:5000

  botón "Ingresar" ──────────►  #/login?next=<tu-clave>
                                la persona pone CUIL y clave
  /auth/cidituc/callback  ◄───  redirige con ?auth=<token>
  valida el token ────────────────────────────────────────►  GET /usuarios/authStatus
  ◄───────────────────────────────────────────────────────   200 { usuarioSinContraseña: {...} }
  firma SU PROPIA cookie
  redirige limpio (sin token en la URL)
```

Tres piezas, tres responsables:

| Pieza | Repo / dueño | Qué hay que tocar |
|---|---|---|
| Derivador (pantalla de login) | `ditec-desarrollo/derivador` | Registrar tu app (paso 2) |
| Tu frontend/backend | tu repo | Botón + callback (pasos 3 a 6) |
| Backend CIDITUC | DITEC | Nada. No pidas la clave de firma: no hace falta |

⚠️ **Los nombres de los repos están cruzados.** `cidituc.smt.gob.ar` lo sirve el
repo **`derivador`**, y `ciudaddigital.smt.gob.ar` lo sirve el repo `cidituc`.
Está verificado comparando los bundles desplegados. Si tocás el repo llamado
`cidituc` para esto, tu cambio se despliega en un dominio al que no mandás a
nadie.

---

## 2. Registrar tu app en el Derivador

En `src/components/Login/Login.jsx` del repo `derivador` hay dos mapas. Sumar
una app es agregar una entrada en cada uno:

```js
const APPS_EXTERNAS = new Map([
  // ...las que ya están...
  ["tu-clave", {
    nombre: "el nombre visible de tu app",
    callbackUrl: import.meta.env.VITE_APP_TUAPP_CALLBACK_URL
  }]
]);

const RESPALDO_CALLBACK = new Map([
  // ...las que ya están...
  ["tu-clave", "https://tu-app.dominio/auth/cidituc/callback"]
]);
```

⚠️ **El respaldo hardcodeado NO es opcional.** Vite hornea las variables
`VITE_*` al compilar, y el `.env.production` del build de producción no las
tiene: sin respaldo, el bundle sale con `callbackUrl: undefined` y la persona
se autentica bien para chocar con "Falta configurar el regreso". Pasó en
producción con UrbanIA y con ELCOP el mismo día. El mecanismo `regresoDe()` ya
existe en el archivo: la variable manda cuando existe, en localhost el respaldo
no se usa (para no sacarte de tu entorno en desarrollo), y el hardcode sólo
actúa cuando el build salió sin la variable.

Después: merge a `dev` **y desplegar**. ⚠️ El merge solo no destraba nada — ya
pasó dos veces que algo estaba mergeado en `dev` y el bundle de producción
seguía siendo el viejo. Se verifica bajando el bundle desplegado y buscando tu
URL adentro:

```bash
curl -s https://cidituc.smt.gob.ar/ | grep -oE '/assets/index-[^"]+\.js'
curl -s https://cidituc.smt.gob.ar/assets/index-XXXX.js | grep -c "tu-app.dominio"
```

---

## 3. El botón de login en tu app

Mandá a:

```
https://cidituc.smt.gob.ar/#/login?next=tu-clave
```

⚠️ **El `#` es obligatorio.** El Derivador usa HashRouter: sin `#`, el router
cae en su ruta comodín y expulsa a la persona a `ciudaddigital.smt.gob.ar`.

⚠️ **Si la URL vive en un `.env`, va entre comillas.** En un archivo `.env` el
`#` abre un comentario: sin comillas se pierde el `#/login` y la redirección
muere en silencio.

⚠️ **No muestres el botón hasta que el paso 2 esté desplegado.** Antes de eso,
la persona se autentica bien en CIDITUC y queda varada en la pantalla de ellos,
sin ningún mensaje. Un interruptor por variable de entorno
(`X_INGRESO_HABILITADO=true`) te deja publicar el callback antes y encender el
botón después.

---

## 4. El callback: validar el token

El Derivador te redirige a tu callback con `?auth=<token>`. El token es un JWT
de ellos — **no lo verifiques vos: la consulta del perfil ES la validación**,
porque el backend verifica la firma antes de responder. Con un token falso
devuelve `401 {"message":"Invalid token"}` (verificado).

```
GET https://estadisticas.smt.gob.ar:5000/usuarios/authStatus
Authorization: <token>
```

⚠️ **El token va pelado, sin `Bearer `.** Con el prefijo, el backend responde
401 siempre.

⚠️ **Es el endpoint de ciudadanos.** Existe también `/usuarios/authStatusIA`,
que consulta la tabla de EMPLEADOS municipales y le devuelve 401 a cualquier
vecino. No "corrijas" tu endpoint copiando lo que hace otra app: cada una usa
el que corresponde a su público.

⚠️ **Cada endpoint envuelve la persona con una clave distinta:**

```
/usuarios/authStatus    → { usuarioSinContraseña: { ...persona } }
/usuarios/authStatusIA  → { user: { ...persona } }
```

Aceptá las dos formas y la plana, por si el backend cambia:

```js
const contenedor = respuesta;
const persona = contenedor.usuarioSinContraseña ?? contenedor.user ?? contenedor;
```

⚠️ **Los campos pueden llegar como número.** El backend hace `SELECT p.*` de
MySQL, así que `documento_persona` o `id_persona` llegan como número si la
columna es numérica. Exigir `typeof === "string"` descarta documentos válidos
en silencio (nos pasó):

```js
const texto = (valor) => {
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
};
```

Campos útiles de la persona: `id_persona`, `documento_persona`,
`nombre_persona`, `apellido_persona`, `email_persona`, `telefono_persona`. La
respuesta trae bastante más, incluidos permisos sobre otros sistemas: **tomá
sólo lo que necesitás**.

---

## 5. ⚠️ El certificado: la trampa más cara de todas

`estadisticas.smt.gob.ar:5000` presenta un certificado válido de Sectigo para
`*.smt.gob.ar`, pero **manda la cadena completa o sólo el certificado final
según por dónde llegues**. Desde algunas redes valida solo; desde otras
(Vercel, por ejemplo) llega sin el intermedio y Node falla con
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Los navegadores lo disimulan porque cachean
el intermedio; tu servidor no.

**Qué hacer:** aportar el intermedio y el raíz de Sectigo como CA en tu cliente
HTTP. La verificación sigue completa (firma, dominio, vencimiento): sólo suplís
lo que el servidor no manda. Se extraen de la propia conexión (son públicos):

```bash
openssl s_client -connect estadisticas.smt.gob.ar:5000 -showcerts </dev/null 2>/dev/null
# guardá el 2° y 3° bloque BEGIN/END CERTIFICATE concatenados
# ("Sectigo Public Server Authentication CA DV R36" y "Root R46")
```

Y en Node:

```js
import { Agent, request } from "node:https";
const agente = new Agent({ ca: process.env.CIDITUC_CA_PEM, keepAlive: false });
```

**Qué NO hacer:** `rejectUnauthorized: false` (o `NODE_TLS_REJECT_UNAUTHORIZED=0`)
en producción. El token viajaría a un servidor sin verificar: cualquiera en el
medio puede quedárselo. Si tu código tiene esa bandera para desarrollo, hacé
que en producción **se ignore o se rechace con error**, para que un parche
temporal no llegue al deploy de colado (nos llegó: la app devolvía 500 a todos
hasta que la sacamos).

Otras dos del mismo rubro:

- **`https://` siempre en producción.** Por `http://` el token viaja en claro.
- **Timeout explícito** (10 s alcanza): sin él, un backend caído te cuelga el
  callback en vez de fallar con mensaje.

---

## 6. Después de validar: tu sesión, tu autorización

**Autenticar no es autorizar.** El token válido sólo prueba que la persona es
quien dice ser ante el municipio. Si tu app es para un grupo (empleados de un
área, inscriptos, becarios...), después del perfil tenés que comprobar el
documento contra TU lista. Sin ese paso, cualquier vecino con cuenta entra.

**Firmá tu propia cookie de sesión** (JWT HS256 con TU secreto, mínimo 32
caracteres) con lo mínimo: id, documento, nombre. Atributos: `httpOnly`,
`secure` en producción, `sameSite: "lax"`, con vencimiento.

**El token de CIDITUC no se guarda.** Ya cumplió su función; conservarlo sólo
amplía lo que se pierde si algo se filtra. Y **no puede sobrevivir en la URL**:
la respuesta del callback es una redirección a una URL limpia, así no queda en
la barra de direcciones ni en el historial.

**Errores con código, no genéricos.** Redirigí con un motivo distinguible
(`?error=sin-token|token-invalido|sin-perfil|no-autorizado`): "no estás en la
lista" no se arregla reintentando y "no pudimos consultar tus datos" sí. Un
único "error al ingresar" manda a todos a insistir contra una puerta cerrada.

**Registrá los fallos en dos niveles.** El resumen (código HTTP, código de
error de red, nombre de la variable mal configurada) **siempre, también en
producción** — sin eso, un certificado roto se ve igual que todo funcionando y
te enterás por las quejas. El detalle (cuerpo de la respuesta, claves
recibidas) sólo en desarrollo, porque puede traer datos de la persona. **El
token no se registra nunca, en ningún nivel.**

---

## 7. Probar sin una persona real

```bash
# 1. El backend responde y valida (espera 401: esa ES la validación andando)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: aaa.bbb.ccc" https://estadisticas.smt.gob.ar:5000/usuarios/authStatus

# 2. Tu callback rechaza limpio un token falso (espera redirección a tu error, no un 500)
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" \
  "https://tu-app.dominio/auth/cidituc/callback?auth=aaa.bbb.ccc"

# 3. La cadena TLS desde TU servidor de producción (no desde tu máquina:
#    el resultado depende de la red — leé los logs de tu hosting tras el paso 2)
```

Para desarrollo local con el Derivador: `.env.local` del derivador con
`VITE_APP_TUAPP_CALLBACK_URL=http://localhost:PUERTO/auth/cidituc/callback`,
`npm run dev` en los dos, y entrar por
`http://localhost:5173/#/login?next=tu-clave`. ⚠️ Vite incrusta las variables
al servir el módulo: si la pestaña ya estaba abierta cuando agregaste la
variable, hace falta `Ctrl+Shift+R`.

## 8. Checklist final

- [ ] Entrada en `APPS_EXTERNAS` **y** en `RESPALDO_CALLBACK`, mergeada a `dev` **y desplegada** (verificado en el bundle)
- [ ] Botón con `#/login?next=tu-clave`, oculto tras un interruptor hasta que el deploy exista
- [ ] Callback: token pelado, sin `Bearer`; timeout; desenvuelve `usuarioSinContraseña ?? user ?? plano`; acepta números
- [ ] CA de Sectigo configurada; verificación TLS **nunca** desactivada en producción
- [ ] Autorización propia después de autenticar
- [ ] Cookie propia httpOnly + secure; el token de CIDITUC no se guarda ni queda en la URL
- [ ] Errores con código; logs de dos niveles; token jamás en logs
- [ ] Probado con token falso desde el hosting real, leyendo los logs del hosting

---

*Dudas: Lucas Nahuz, Dirección de IA (lnahuz@smt.gob.ar). La integración de
referencia es el Portal del Becario de ELCOP; este documento sale de lo
aprendido ahí.*
