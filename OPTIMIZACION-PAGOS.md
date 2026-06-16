# Optimización: registro de pagos

Fecha: 2026-06-16

## Problema

Registrar 1 pago tardaba mucho: ~7 round-trips remotos a Supabase, todos
secuenciales (encadenados, no en paralelo).

**Frontend (`add-payment-dialog.tsx`)**, secuencial:
1. `POST /api/pagos`
2. `await PUT /api/alumnos/:dni` (segundo write al mismo alumno)
3. `onPaymentAdded()` → `refreshPayments()` (refetch lista de pagos)

**Backend `addPago` (5 calls secuenciales adentro del paso 1):**
1. INSERT pago
2. `getAlumnosFromSheet()` → `SELECT * FROM alumnos` (TODA la tabla) + `.find()` en JS
3. `getPlanesFromSheet()` → SELECT todos los planes
4. UPDATE alumno (gymcoins)
5. INSERT registro_puntos

Cada round-trip ~150–400 ms → total ~1.5–3 s.

## ⚠️ Garantía: no se borró NADA de la base

Estos cambios son **solo de lógica de código**. No hay:
- ningún `DELETE` / `.delete()` nuevo,
- ninguna migración,
- ningún cambio de schema,
- ningún trigger de base de datos.

Cero datos eliminados o modificados de forma destructiva.

## Cambios aplicados (A + B + C + D)

### A — Quick wins backend (riesgo cero)

**`backend/services/googleSheets.js`**
- Nueva función `getAlumnoByDNI(dni)`: trae **1 sola fila** con
  `.eq('dni', dni).is('deleted_at', null).maybeSingle()` en vez de bajar toda
  la tabla `alumnos` y filtrar en JS.

**`backend/controllers/pagos.controller.js` → `addPago`**
- Insert del pago + lectura del alumno + lectura de planes ahora corren **en
  paralelo** con `Promise.all([...])`:
  ```js
  const [nuevoPago, alumno, coinsPorPlan] = await Promise.all([
    appendPagoToSheet(pago),
    getAlumnoByDNI(pago["Socio DNI"]),
    obtenerCoinsPorPlan(),
  ]);
  ```

### B — Eliminado el doble write del alumno (riesgo medio)

Antes el frontend hacía un `PUT /api/alumnos/:dni` separado para actualizar
plan / fecha de vencimiento / clases, **además** del UPDATE de coins que ya
hacía el backend → dos writes a la misma fila.

- **Backend**: `addPago` ahora hace **un solo UPDATE** del alumno que combina
  coins + (si el tipo es `GIMNASIO` o `CLASE`) plan, fecha de vencimiento,
  clases pagadas y clases realizadas.
- **Frontend**: se eliminó la llamada `PUT /api/alumnos/:dni`. El `POST /api/pagos`
  ahora manda también `Clases_pagadas` para que el backend actualice todo.

### C — UI optimista (ganancia percibida)

**`frontend/components/dashboard/recepcionist/payments/add-payment-dialog.tsx`**
- Al enviar: se cierra el modal, se muestra el toast de éxito y se actualiza el
  estado local del miembro **al instante**. El `POST` viaja en background.
- Si el write falla, se muestra un toast de error (no se borró nada; se puede
  reintentar).

### D — Registro de puntos en background (sin tocar la base)

**`backend/controllers/pagos.controller.js` → `addPago`**
- `appendRegistroPuntoToSheet(...)` ya **no bloquea** la respuesta: se responde
  al cliente apenas se guarda el pago y se actualiza el alumno, y el registro de
  puntos se ejecuta como fire-and-forget (`.catch` que solo loguea el error).
- **Sin** trigger de Postgres, **sin** cambio de schema.

## Resultado

Camino crítico del backend: de **5 pasos secuenciales** → **2** (un `Promise.all`
+ un UPDATE). Camino del frontend: de **3 requests bloqueantes** → respuesta
**instantánea** (write en background).

## Archivos tocados

- `backend/services/googleSheets.js`
- `backend/controllers/pagos.controller.js`
- `frontend/components/dashboard/recepcionist/payments/add-payment-dialog.tsx`

## Regla: alumno de prueba sin puntos (DNI 7777777)

El alumno de prueba **DNI 7777777 (NO BORRAR)** nunca acumula puntos/coins.

Cubierto en código:
- **`backend/controllers/pagos.controller.js`** → `addPago`: constante
  `DNI_PRUEBA = "7777777"`. Si el pago es de ese DNI, `coinsASumar = 0` → no se
  modifica `gymcoins` y no se crea registro en `registro_puntos`. El pago y el
  plan/fecha/clases del alumno **sí** se registran normalmente.
- **`backend/services/googleSheets.js`** → `appendAsistenciaToSheet`: no inserta
  los 25 puntos si el DNI es 7777777 (guard defensivo; esa función hoy no está en
  el camino activo).

Decisión (2026-06-16): la regla aplica **solo a pagos**.
- Las asistencias reales suman 25 puntos vía el RPC `registrar_asistencia(p_dni)`
  dentro de la base. Por decisión del usuario, **NO** se modificó ese RPC, así que
  el DNI 7777777 sigue sumando puntos al registrar asistencia.

## Notas / seguimiento

- El botón "Registrar pago" ya no usa el estado `isSubmitting` (flujo optimista,
  queda siempre habilitado). Se puede limpiar ese estado en un cleanup posterior.
- La función `getAlumnosFromSheet` sigue importada en el controller aunque ya no
  se usa en `addPago`; se mantiene por compatibilidad y no afecta el runtime.
