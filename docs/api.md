# Diseño de la API — Jardín Rival

Toda la comunicación usa JSON, tanto en la entrada como en la salida. El
frontend se comunica con `fetch` nativo; no se usa ninguna librería HTTP.

## POST /api/partida

Crea una nueva partida y devuelve su estado inicial.

**Entrada:** sin cuerpo.

**Respuesta 201:**
```json
{
  "id": "a1b2c3d",
  "turno": "jugador1",
  "turnosRestantes": 18,
  "estado": "en_curso",
  "ganador": null,
  "huerto": [
    { "fila": 0, "columna": 0, "propietario": null, "etapa": "vacio", "regadas": 0, "especial": null },
    { "fila": 0, "columna": 1, "propietario": null, "etapa": "vacio", "regadas": 0, "especial": "fertil" }
  ],
  "jugadores": {
    "jugador1": { "agua": 10 },
    "jugador2": { "agua": 10 }
  },
  "plagas": [],
  "ultimoMensaje": "La partida ha comenzado. Turno de jugador1."
}
```

El campo `plagas` es un arreglo de objetos `{ "fila": number, "columna":
number }`, uno por cada plaga activa en el tablero (puede haber hasta 2 a la
vez, o estar vacío si no hay ninguna). Se actualiza automáticamente después
de cada acción que no sea `ahuyentar`.

## GET /api/partida/:id

Devuelve el estado actual de una partida existente.

**Respuesta 200:** mismo formato que la respuesta de creación.

**Respuesta 404** si el id no existe:
```json
{ "mensaje": "Partida no encontrada." }
```

## POST /api/partida/:id/accion

Ejecuta una acción de un jugador sobre la partida.

**Entrada:**
```json
{
  "jugador": "jugador1",
  "tipo": "plantar",
  "fila": 0,
  "columna": 1
}
```

Los campos `fila` y `columna` se omiten para el tipo `pasar`.

**Respuesta 200 (acción válida):**
```json
{
  "exito": true,
  "mensaje": "jugador1 plantó una semilla en (0, 1).",
  "partida": { "...": "estado actualizado de la partida, mismo formato que GET" }
}
```

**Respuesta 400 (acción inválida):**
```json
{
  "exito": false,
  "mensaje": "Esa parcela ya está ocupada.",
  "partida": { "...": "estado sin cambios" }
}
```

## Tipos de acción (`tipo`)

| tipo         | requiere fila/columna | efecto                                             |
|--------------|------------------------|-----------------------------------------------------|
| `plantar`    | sí                     | crea una planta propia en una parcela vacía propia |
| `regar`      | sí                     | avanza la etapa de una planta propia               |
| `robar_agua` | sí (parcela rival plantada) | hace retroceder una etapa a la planta rival y tú ganas agua |
| `ahuyentar`  | sí (casilla exacta de una plaga) | elimina esa plaga antes de que muerda una planta |
| `pasar`      | no                     | recupera 1 de agua                                 |

## Las plagas

Independientemente del tipo de acción elegido (salvo `ahuyentar`), el
servidor mueve automáticamente cada plaga activa un paso hacia la planta más
cercana después de aplicar la acción (puede haber hasta 2 a la vez), y lo
refleja en el campo `mensaje` de la respuesta (por ejemplo:
`"jugador1 plantó una semilla en (0, 1). · Una nueva plaga apareció en
(2, 4)."`). Esto demuestra que el backend participa en una decisión que no
depende directamente de la jugada del usuario, sino del estado del juego en
su conjunto.
