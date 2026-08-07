# Pedido a DITEC — registrar ELCOP en el ingreso de CiDiTuc

Texto listo para reenviar. El cambio está preparado en la rama local
`elcop-portal-becario` del repositorio `ditec-desarrollo/cidituc`.

---

**Asunto:** Registrar ELCOP en el derivador de ingreso de CiDiTuc

Hola. Desde la Dirección de IA estamos construyendo el Portal del Becario de
ELCOP —la Escuela de Liderazgo y Comunicación Política, del convenio entre la
Municipalidad y la UNSTA— y el ingreso lo resolvimos con CiDiTuc, siguiendo el
mismo patrón que ya usa hub-ia.

Necesitamos que ELCOP quede registrado en la cadena de derivación. Hoy, al
volver con `next=elcop`, cae en el caso por defecto y la persona termina en el
derivador de CiDiTuc: se autentica correctamente y nunca vuelve al portal, sin
ningún mensaje de error.

**El cambio** es una rama más en `src/routes/PrivateRoute.jsx`, idéntica en
forma a la de `hub-ia`, ubicada antes del `else` final:

```jsx
} else if (nextParam == "elcop" && localStorage.getItem("token")) {
  const token = localStorage.getItem("token");

  const url = new URL(
    `https://landing-elcop.vercel.app/auth/cidituc/callback`,
  );
  // const url = new URL(`http://localhost:3000/auth/cidituc/callback`);

  url.searchParams.append("auth", token);

  window.location.href = url.toString();
}
```

No toca ninguna de las otras integraciones.

**Lo que necesitamos de ustedes:** aplicar el cambio y desplegarlo cuando les
quede cómodo. No tenemos apuro de fecha; sí necesitamos saber cuándo, para
tener nuestro lado publicado antes.

**Dos cosas que vimos revisando el código, por si les sirven.** Ninguna nos
bloquea ni es urgente:

- `/usuarios/dni/:dni` y `/usuarios/email/:email` en `cidituc-backend` no pasan
  por el middleware `auth`. Si están expuestos públicamente, permitirían
  consultar datos de un vecino conociendo sólo su documento. Vale la pena
  verificar si son alcanzables desde afuera.
- `estadisticas.smt.gob.ar:5000` presenta un certificado válido de Sectigo para
  `*.smt.gob.ar`, pero envía sólo el certificado final sin el intermedio de la
  autoridad. Los navegadores lo disimulan porque suelen tenerlo cacheado, pero
  Node falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Instalar la cadena completa
  en el servidor lo resuelve para todos los que consuman ese backend.

Gracias.

---

## Notas internas

### Sobre el dominio

Quedó `landing-elcop.vercel.app`, confirmado por ELCOP. Es distinto del patrón
del resto: las doce aplicaciones registradas en el derivador son todas
subdominios de `smt.gob.ar`.

Vale tenerlo presente por dos motivos, ninguno bloqueante:

- **Cómo se ve.** La persona sale de `cidituc.smt.gob.ar` y aterriza en un
  dominio de Vercel. Es exactamente el salto que a la gente se le enseña a
  desconfiar. No hay riesgo real —la contraseña se escribe sólo en CiDiTuc—,
  pero para un programa oficial del municipio y la UNSTA es una diferencia de
  presentación.
- **Cuánto cuesta cambiarlo después.** La URL queda hardcodeada en el código de
  DITEC. Si más adelante se decide mover a `elcop.smt.gob.ar`, hace falta otro
  despliegue de ellos, no sólo un cambio nuestro.

Del lado nuestro sumar un dominio propio en Vercel es trivial y no rompe nada:
el costo real de cambiar está en coordinar el segundo despliegue con DITEC.

**No pushear a `ditec-desarrollo/cidituc` sin que ellos lo pidan.** Es un
sistema del que dependen doce aplicaciones del municipio —turnos, catastro,
presupuesto participativo— y un despliegue a destiempo ahí rompe cosas que no
son nuestras.

El commit local está en la rama `elcop-portal-becario`. Si prefieren recibirlo
como parche en vez de como rama, se genera con:

```bash
git format-patch origin/master
```

Para probar antes de que esté desplegado, ver
[`registrar-elcop-en-cidituc.md`](registrar-elcop-en-cidituc.md).
