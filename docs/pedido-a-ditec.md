# Pedido a DITEC — registrar ELCOP en el ingreso de CiDiTuc

> **El pedido ya no va por mail: va por PR.** La rama `elcop-portal-becario`
> está pusheada a `ditec-desarrollo/cidituc`, y el texto para el pull request
> está en [`pr-cidituc.md`](pr-cidituc.md).
>
> Este documento se conserva porque el razonamiento sigue valiendo, pero **la
> vía correcta es el PR**: es como trabaja el equipo de DITEC —su `master` avanza
> por pull requests, y `hub-ia` entró así— y es donde efectivamente miran. Un
> pedido por mail queda esperando que alguien lo lea.

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

### Corregido: pushear la rama sí, mergear no

Este documento decía **"no pushear a `ditec-desarrollo/cidituc` sin que ellos lo
pidan"**, por ser un sistema del que dependen doce aplicaciones del municipio
—turnos, catastro, presupuesto participativo—. La precaución era correcta pero
estaba mal apuntada, y nos costó tiempo:

**Lo riesgoso es el merge y el despliegue, no la rama.** Pushear una rama no
despliega nada, y el merge lo deciden ellos igual. Al frenarnos un paso antes, el
pedido quedó como un texto en un `.md` esperando que alguien leyera un mail, en
vez de estar en su cola de pull requests. Su `master` avanza por PRs y las ramas
de feature conviven en el remoto sin molestar a nadie.

Lo que sigue valiendo: **no mergear ni desplegar nada nuestro en sus repos.**

El commit es `394bd46`, en la rama `elcop-portal-becario`, ya pusheada. Si
alguna vez prefieren recibirlo como parche en vez de como rama:

```bash
git format-patch origin/master
```

Para probar antes de que esté desplegado, ver
[`registrar-elcop-en-cidituc.md`](registrar-elcop-en-cidituc.md).
