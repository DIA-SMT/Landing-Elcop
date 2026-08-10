# Ingreso al portal con Ciudadano Digital

Único documento del ingreso. Reemplaza a cuatro anteriores que se contradecían
entre sí.

**Estado: funciona de punta a punta en desarrollo**, probado el 10 de agosto de
2026 con una cuenta real contra el backend de producción. Falta que DITEC
despliegue para que funcione fuera de la máquina de desarrollo.

---

## 1. Los nombres engañan: qué repo es cuál

Verificado comparando los bundles desplegados, no deducido:

| Dominio | Lo sirve el repo | Cómo se comprobó |
|---|---|---|
| `cidituc.smt.gob.ar` | **`derivador`** | Su bundle trae `Libre Deuda` y `Combustibles` |
| `ciudaddigital.smt.gob.ar` | **`cidituc`** | Su bundle trae `hub-ia` y `juventudyaccion` |

Los títulos también están cruzados y los dos `package.json` se llaman
`ditec-contable`.

**Nosotros apuntamos a `cidituc.smt.gob.ar`, así que el repo que hay que tocar es
`derivador`.** Un PR al repo llamado `cidituc` se desplegaría en un dominio al que
no mandamos a nadie.

## 2. Cómo funciona

1. El portal manda a `https://cidituc.smt.gob.ar/#/login?next=elcop`. El `#` es
   obligatorio: sin él el router cae en su ruta comodín y expulsa a
   `ciudaddigital.smt.gob.ar`.
2. La persona escribe sus credenciales en el Derivador.
3. El Derivador redirige a nuestro callback con el token en `auth`.
4. Nuestro callback hace tres pasos y ninguno se puede saltear:
   consulta el perfil, comprueba el padrón, firma nuestra cookie.

**La consulta del perfil es la validación del token.** Está verificado: con un
token falso el backend responde `401 Invalid token`. Por eso no guardamos su clave
de firma — no agregaría ninguna comprobación que esa consulta no haga ya.

El paso del padrón es el que separa autenticar de autorizar: sin él, cualquier
vecino con cuenta entraría al portal.

## 3. ⚠️ Dos trampas del backend que ya costaron una sesión

**Cada endpoint envuelve la persona con una clave distinta:**

```
/usuarios/authStatus    → { usuarioSinContraseña: { ...persona } }   ← ciudadanos
/usuarios/authStatusIA  → { user: { ...persona } }                    ← empleados
```

Usamos el primero. El segundo consulta la tabla `empleado` y devolvería 401 a un
becario, así que **no hay que "corregir" nuestro endpoint copiando lo que hace
hub-ia**.

**Y los campos pueden llegar como número.** El backend consulta con `SELECT p.*`,
así que una columna numérica llega a JavaScript como número. Exigir
`typeof === "string"` descartaba documentos válidos en silencio.

## 4. Cómo probarlo en desarrollo

Necesitás una cuenta de CiDiTuc propia y tres cosas configuradas.

**En `.env.local` de este proyecto:**

```
CIDITUC_BACKEND_URL=https://estadisticas.smt.gob.ar:5000
NEXT_PUBLIC_CIDITUC_LOGIN_URL="http://localhost:5173/#/login"
CIDITUC_INGRESO_HABILITADO=true
CIDITUC_TLS_INSEGURO=true
ELCOP_PADRON_PROVISORIO=<tu documento, sin puntos>
```

`CIDITUC_TLS_INSEGURO` hace falta por lo del certificado (§5) y **el código la
rechaza si `NODE_ENV` es producción**, así que no puede filtrarse al deploy. Las
comillas en la URL de login no son opcionales: en un `.env` el `#` abre un
comentario y sin ellas se pierde `#/login`.

**En `.env.local` del Derivador:**

```
VITE_APP_ELCOP_CALLBACK_URL=http://localhost:3000/auth/cidituc/callback
```

**Y después:** `npm run dev` acá, `npm run dev` en el Derivador, y entrar a
`http://localhost:5173/#/login?next=elcop`.

> **Vite incrusta las variables al servir el módulo.** Si el Derivador ya estaba
> abierto cuando agregaste la variable, la pestaña se queda con el valor viejo:
> hace falta `Ctrl+Shift+R`. Nos costó dos intentos.

### Si falla, el error dice dónde

| En la URL | Qué significa |
|---|---|
| `no-es-becario` | El token es válido pero el documento no está en el padrón |
| `sin-perfil` | No se pudo consultar el perfil: red, certificado, o forma inesperada |
| `documento-invalido` | Llegó un documento que no se pudo leer |
| `token-invalido` | No tiene forma de token; suele ser que se cortó al copiarlo |

Y en desarrollo el servidor imprime el detalle: estado HTTP, código de red, el
tipo de `documento_persona` e `id_persona`, y las claves recibidas. Nunca el token
ni valores del perfil.

## 5. Lo que falta para producción

**a) El PR al Derivador.** Rama `elcop-portal-becario` pusheada a
`ditec-desarrollo/derivador`, contra `dev` y no `master`:

<https://github.com/ditec-desarrollo/derivador/pull/new/elcop-portal-becario>

Agrega `next=elcop` siguiendo el flujo que Agustín sumó para UrbanIA en el PR #96.
En vez de duplicar su bloque, las aplicaciones externas pasaron a una tabla, así
sumar una es agregar una entrada. **Conviene avisarle antes**, porque toca código
que él acaba de mergear.

Su PR #96 está mergeado en `dev` **pero no desplegado** —el bundle de producción no
trae la cadena de UrbanIA—, así que lo que destraba esto es el despliegue, no el
merge.

**b) ⚠️ La cadena de certificados**, y es un bloqueo independiente del PR.
`estadisticas.smt.gob.ar:5000` envía sólo el certificado final, sin el intermedio
de Sectigo, y Node falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. En desarrollo se
esquiva con `CIDITUC_TLS_INSEGURO`; **en producción el código lo prohíbe a
propósito**, así que el ingreso no va a funcionar aunque el PR se despliegue.

Lo resuelve infraestructura instalando la cadena completa —arregla el problema para
todos los que consuman ese backend— o nosotros cargando el intermedio en
`CIDITUC_CA_PEM`.

**c) El padrón real.** Hoy sale de `ELCOP_PADRON_PROVISORIO`. Los becarios reales
salen de las postulaciones marcadas como seleccionadas, que es la Fase 1.

## 6. Dos cosas que vimos en su código, sin urgencia

Van en la descripción del PR:

- `/usuarios/dni/:dni` y `/usuarios/email/:email` no pasan por el middleware
  `auth`. Si están expuestos, permitirían consultar datos de un vecino conociendo
  sólo su documento.
- `/usuarios/registrarAccesoExterno` tampoco, y es un `POST` que inserta filas.

## 7. Nota sobre el dominio

Quedó `landing-elcop.vercel.app`, confirmado por ELCOP, y es distinto del patrón
del resto —las demás aplicaciones son subdominios de `smt.gob.ar`—. Con el camino
por Derivador la URL de vuelta es una variable de entorno suya y no código, así que
mudarse a `elcop.smt.gob.ar` no exigiría un segundo despliegue de ellos: sólo
cambiar la variable.
