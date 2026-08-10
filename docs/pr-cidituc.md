# PR en CiDiTuc — registrar ELCOP en el derivador

Rama `elcop-portal-becario` **ya pusheada** a `ditec-desarrollo/cidituc`.

**Abrir el PR:**
<https://github.com/ditec-desarrollo/cidituc/pull/new/elcop-portal-becario>

Base: `master`. Un commit, `394bd46`, 13 líneas en `src/routes/PrivateRoute.jsx`.

---

## Título

```
Registrar ELCOP en el derivador de ingreso
```

## Descripción

Hola. Desde la Dirección de IA estamos construyendo el Portal del Becario de
ELCOP —la Escuela de Liderazgo y Comunicación Política, del convenio entre la
Municipalidad y la UNSTA— y el ingreso lo resolvimos con CiDiTuc, siguiendo el
mismo patrón que ya usa `hub-ia`.

**El problema.** Hoy, al volver con `next=elcop`, cae en el `else` final y la
persona termina en el derivador de CiDiTuc: se autentica correctamente y nunca
vuelve al portal, sin ningún mensaje de error.

**El cambio.** Una rama más en `src/routes/PrivateRoute.jsx`, idéntica en forma a
la de `hub-ia`, ubicada antes del `else` final. No toca ninguna de las otras
integraciones.

**De nuestro lado ya está publicado.** El callback
(`https://landing-elcop.vercel.app/auth/cidituc/callback`) está en producción y
funcionando, así que cuando ustedes despliegan, el circuito cierra. No tenemos
apuro de fecha; sí nos sirve saber cuándo, para acompañarlo.

### Un pedido aparte, que nos bloquea

`estadisticas.smt.gob.ar:5000` **envía sólo el certificado final, sin el
intermedio de la autoridad.** Lo verificamos de nuevo hoy: el servidor manda un
único certificado, el de `*.smt.gob.ar` emitido por *Sectigo Public Server
Authentication CA DV R36*, y ese intermedio no viaja.

Los navegadores lo disimulan porque suelen tenerlo cacheado, pero Node falla con
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Como nuestro backend consulta
`/usuarios/authStatus` desde Node para validar el token y traer el documento,
**con la cadena incompleta el ingreso no funciona en producción aunque este PR
esté mergeado.**

Instalar la cadena completa en el servidor lo resuelve para todos los que
consuman ese backend, no sólo para nosotros. Si les queda más cómodo, podemos
cargar el intermedio de nuestro lado como alternativa; preferimos la primera.

### Otra cosa que vimos, sin urgencia

`/usuarios/dni/:dni` y `/usuarios/email/:email` en `cidituc-backend` no pasan por
el middleware `auth`. Si están expuestos públicamente, permitirían consultar
datos de un vecino conociendo sólo su documento. Vale la pena verificar si son
alcanzables desde afuera.

Gracias.

---

## Nota sobre el dominio

Quedó `landing-elcop.vercel.app`, confirmado por ELCOP, y es distinto del patrón
del resto: las doce aplicaciones registradas en el derivador son todas
subdominios de `smt.gob.ar`.

La URL queda fija en el código de DITEC, así que si más adelante se decide mover
a `elcop.smt.gob.ar` hace falta otro despliegue de ellos. Sumar el dominio en
Vercel es trivial de nuestro lado; el costo real está en coordinar ese segundo
despliegue. Conviene tenerlo en cuenta ahora y no después.
