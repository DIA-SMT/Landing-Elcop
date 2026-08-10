# Registrar ELCOP en CIDITUC

Para que CIDITUC devuelva al Portal del Becario después del ingreso, hay que
agregar a ELCOP en su lista de aplicaciones conocidas. **Sin esto el ingreso no
funciona**, y el síntoma es confuso: la persona se autentica bien y termina en
la pantalla principal de CIDITUC, sin ningún error.

## Por qué

CIDITUC no acepta una URL de vuelta como parámetro. En
`src/routes/PrivateRoute.jsx` tiene una cadena de condiciones que mapea cada
valor conocido de `next` a una URL fija:

```
presupuesto-participativo · consulta-publica · turno-ciudadana · catastro
eventos · turno-carnet · turno-castracion · turno-campus · turno-asistencia
turno-catastro · hub-ia · juventudyaccion
```

Si el valor no está en la lista, cae en el caso por defecto, que manda al
derivador de CIDITUC. Eso es lo que pasa hoy con `next=elcop`.

Es una decisión razonable de su parte, dicho sea de paso: aceptar una URL
arbitraria convertiría a CIDITUC en un redirector abierto, y cualquiera podría
usarlo para mandar un token a un sitio ajeno.

## El cambio

En el repositorio `cidituc`, archivo `src/routes/PrivateRoute.jsx`, sumar una
rama más siguiendo el mismo patrón que `hub-ia`:

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

Va **antes** del `else` final, que es el que atrapa todo lo que no reconoce.

> ⚠️ **El callback tiene que estar publicado antes de que DITEC despliegue.**
> La URL queda fija en su código: si redirigen a una ruta que todavía no
> existe, la persona recibe un 404 después de autenticarse. Producción sale de
> `main`, así que el ingreso tiene que estar mergeado ahí primero.

## Cómo probar antes de que esté desplegado

Igual que hacen con `hub-ia`: se levanta CIDITUC local, se comenta la URL de
producción y se descomenta la de `localhost`.

1. Levantar el backend y el frontend de CIDITUC en local.
2. En `PrivateRoute.jsx`, dejar activa la línea de `localhost:3000`.
3. En el `.env.local` de este proyecto, apuntar
   `NEXT_PUBLIC_CIDITUC_LOGIN_URL` al CIDITUC local. Ojo con el puerto: Vite
   usa 5173, pero si está ocupado salta a 5174.
4. Apuntar `CIDITUC_BACKEND_URL` al backend local. Con `http://` alcanza en
   desarrollo; en producción el código lo rechaza, porque el token viajaría sin
   cifrar.
5. Agregar el documento de prueba a `ELCOP_PADRON_PROVISORIO`.

> **No hace falta ninguna clave de firma de CiDiTuc.** Este paso pedía poner su
> `JWT_SECRET_KEY` en `CIDITUC_JWT_SECRET`, una variable que ya no existe: se
> quitó al ver que la consulta del perfil valida el token de todos modos —el
> backend verifica la firma antes de responder—. Guardar una clave compartida por
> las doce aplicaciones del municipio, para una comprobación que ya se hacía, era
> ampliar el daño de una filtración a cambio de nada.

## Lo que este proyecto ya tiene resuelto

- La consulta del perfil al backend de CIDITUC, que trae el documento **y valida
  el token de paso**: ellos verifican la firma antes de responder, así que uno
  falso o vencido no devuelve una persona.
- La comprobación contra el padrón de becarios, que es lo que impide que
  cualquier vecino con cuenta entre al portal.
- La sesión propia, en una cookie firmada aparte con `ELCOP_SESSION_SECRET`.
- El callback, publicado en producción desde `main`.

## Lo que falta

1. **Que CIDITUC sepa a dónde devolver.** Es el PR: ver
   [`pr-cidituc.md`](pr-cidituc.md).
2. **Que `estadisticas.smt.gob.ar:5000` mande la cadena completa de
   certificados.** Hoy envía sólo el certificado final y Node falla con
   `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. **Es un segundo bloqueo, independiente del
   PR:** con la cadena incompleta el ingreso no funciona en producción aunque
   DITEC despliegue, porque el código prohíbe desactivar la verificación fuera de
   desarrollo. La alternativa de nuestro lado es cargar el intermedio en
   `CIDITUC_CA_PEM`.
