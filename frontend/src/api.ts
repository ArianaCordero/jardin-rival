import { Partida, RespuestaAccion, IdJugador, TipoAccion } from './types';

// Toda la comunicación usa la API nativa fetch, con JSON en entrada y salida,
// tal como exige el examen. No se usa ninguna librería HTTP externa (nada de axios).

export async function crearPartidaRemota(): Promise<Partida> {
  const respuesta = await fetch('/api/partida', { method: 'POST' });
  if (!respuesta.ok) {
    throw new Error('No se pudo crear la partida.');
  }
  return respuesta.json();
}

export async function obtenerPartida(id: string): Promise<Partida> {
  const respuesta = await fetch(`/api/partida/${id}`);
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener el estado de la partida.');
  }
  return respuesta.json();
}

export async function enviarAccion(
  id: string,
  jugador: IdJugador,
  tipo: TipoAccion,
  fila?: number,
  columna?: number
): Promise<RespuestaAccion> {
  const respuesta = await fetch(`/api/partida/${id}/accion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jugador, tipo, fila, columna }),
  });
  const datos: RespuestaAccion = await respuesta.json();
  return datos;
}
