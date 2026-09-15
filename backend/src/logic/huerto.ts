import {
  Partida,
  Parcela,
  IdJugador,
  SolicitudAccion,
  RespuestaAccion,
  Especial,
  Plaga,
} from '../types';

export const FILAS = 4;
export const COLUMNAS = 6;
export const TURNOS_INICIALES = 18;
export const AGUA_INICIAL = 10;

const COSTO_PLANTAR = 2;
const COSTO_REGAR_NORMAL = 1;
const COSTO_REGAR_SECA = 2;
const COSTO_INTENTO_ROBO = 1;
const GANANCIA_SABOTAJE = 2;
const GANANCIA_DESCANSO = 1;
const REGADAS_PARA_FLOR_FERTIL = 1;
const REGADAS_PARA_FLOR_NORMAL = 2;
const CANTIDAD_PARCELAS_ESPECIALES = 3;
const PROBABILIDAD_APARICION_PLAGA = 0.35;
const MAX_PLAGAS_SIMULTANEAS = 2;
const UMBRAL_TURNOS_CAOS = 6;
const PROBABILIDAD_EXTRA_CAOS = 0.25;
const COSTO_AHUYENTAR = 1;
const PROBABILIDAD_EVENTO = 0.3;

function territorioDe(columna: number): IdJugador {
  return columna < COLUMNAS / 2 ? 'jugador1' : 'jugador2';
}

function indice(fila: number, columna: number): number {
  return fila * COLUMNAS + columna;
}

function crearHuertoVacio(): Parcela[] {
  const huerto: Parcela[] = [];
  for (let fila = 0; fila < FILAS; fila++) {
    for (let columna = 0; columna < COLUMNAS; columna++) {
      huerto.push({
        fila,
        columna,
        propietario: null,
        etapa: 'vacio',
        regadas: 0,
        especial: null,
      });
    }
  }
  return huerto;
}

function sembrarParcelasEspeciales(huerto: Parcela[]): void {
  const tipos: Especial[] = ['fertil', 'seca'];
  let colocadas = 0;
  let intentos = 0;
  while (colocadas < CANTIDAD_PARCELAS_ESPECIALES * 2 && intentos < 500) {
    intentos++;
    const idx = Math.floor(Math.random() * huerto.length);
    const tipo = tipos[colocadas % 2];
    if (huerto[idx].especial === null) {
      huerto[idx].especial = tipo;
      colocadas++;
    }
  }
}

export function crearPartida(id: string): Partida {
  const huerto = crearHuertoVacio();
  sembrarParcelasEspeciales(huerto);
  return {
    id,
    turno: 'jugador1',
    turnosRestantes: TURNOS_INICIALES,
    estado: 'en_curso',
    ganador: null,
    huerto,
    plagas: [],
    jugadores: {
      jugador1: { agua: AGUA_INICIAL },
      jugador2: { agua: AGUA_INICIAL },
    },
    ultimoMensaje: 'La partida ha comenzado. Turno de jugador1.',
  };
}

function requeridasParaFlor(especial: Especial): number {
  return especial === 'fertil' ? REGADAS_PARA_FLOR_FERTIL : REGADAS_PARA_FLOR_NORMAL;
}

function actualizarEtapa(parcela: Parcela): void {
  const requeridas = requeridasParaFlor(parcela.especial);
  if (parcela.regadas <= 0) {
    parcela.etapa = 'semilla';
  } else if (parcela.regadas < requeridas) {
    parcela.etapa = 'brote';
  } else {
    parcela.etapa = 'flor';
  }
}

function parcelaPlantadaMasCercana(huerto: Parcela[], origen: Plaga): Parcela | null {
  let mejor: Parcela | null = null;
  let mejorDistancia = Infinity;
  for (const parcela of huerto) {
    if (parcela.propietario === null) continue;
    const distancia = Math.abs(parcela.fila - origen.fila) + Math.abs(parcela.columna - origen.columna);
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = parcela;
    }
  }
  return mejor;
}

// Cada turno, cada plaga activa se desplaza una casilla hacia la planta más
// cercana (movimiento real por turnos, tal como permite el examen). Si una
// plaga llega exactamente a una parcela plantada, la devora por completo y
// desaparece. Puede haber hasta MAX_PLAGAS_SIMULTANEAS a la vez, y en los
// últimos turnos de la partida la probabilidad de que aparezca una nueva
// aumenta, para que el final se sienta más caótico y urgente.
function actualizarPlagas(partida: Partida): string | null {
  const mensajes: string[] = [];

  const plagasQueQuedan: Plaga[] = [];
  for (const plagaActual of partida.plagas) {
    const objetivo = parcelaPlantadaMasCercana(partida.huerto, plagaActual);
    if (!objetivo) {
      plagasQueQuedan.push(plagaActual);
      continue;
    }
    const plaga = { ...plagaActual };
    if (plaga.fila !== objetivo.fila) {
      plaga.fila += plaga.fila < objetivo.fila ? 1 : -1;
    } else if (plaga.columna !== objetivo.columna) {
      plaga.columna += plaga.columna < objetivo.columna ? 1 : -1;
    }
    if (plaga.fila === objetivo.fila && plaga.columna === objetivo.columna) {
      const parcela = partida.huerto[indice(plaga.fila, plaga.columna)];
      parcela.regadas = 0;
      actualizarEtapa(parcela);
      mensajes.push(`¡Una plaga devoró la parcela (${plaga.fila}, ${plaga.columna}) por completo!`);
    } else {
      plagasQueQuedan.push(plaga);
    }
  }
  partida.plagas = plagasQueQuedan;

  const probabilidadActual =
    partida.turnosRestantes <= UMBRAL_TURNOS_CAOS
      ? PROBABILIDAD_APARICION_PLAGA + PROBABILIDAD_EXTRA_CAOS
      : PROBABILIDAD_APARICION_PLAGA;

  if (partida.plagas.length < MAX_PLAGAS_SIMULTANEAS && Math.random() < probabilidadActual) {
    const fila = Math.floor(Math.random() * FILAS);
    const columna = Math.random() < 0.5 ? 0 : COLUMNAS - 1;
    const yaHayAhi = partida.plagas.some((p) => p.fila === fila && p.columna === columna);
    if (!yaHayAhi) {
      partida.plagas.push({ fila, columna });
      mensajes.push(`Una nueva plaga apareció en (${fila}, ${columna}).`);
    }
  }

  return mensajes.length > 0 ? mensajes.join(' · ') : null;
}

// Cada turno hay una probabilidad de que ocurra un evento aleatorio que afecta
// a ambos jugadores por igual (lluvia, sequía) o premia al jugador que acaba de
// jugar (racha de suerte). Esto aporta variabilidad extra e impide que la
// partida se sienta siempre igual.
function dispararEvento(partida: Partida, jugadorActual: IdJugador): string | null {
  if (Math.random() >= PROBABILIDAD_EVENTO) return null;

  const tipos = ['lluvia', 'sequia', 'suerte'] as const;
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];

  if (tipo === 'lluvia') {
    partida.jugadores.jugador1.agua += 2;
    partida.jugadores.jugador2.agua += 2;
    return 'Lluvia repentina: ambos jugadores ganan 2 de agua.';
  }

  if (tipo === 'sequia') {
    partida.jugadores.jugador1.agua = Math.max(0, partida.jugadores.jugador1.agua - 1);
    partida.jugadores.jugador2.agua = Math.max(0, partida.jugadores.jugador2.agua - 1);
    return 'Sequía repentina: ambos jugadores pierden 1 de agua.';
  }

  // Racha de suerte: una parcela propia del jugador que acaba de actuar,
  // que no esté ya en flor, avanza una etapa gratis.
  const propias = partida.huerto.filter((p) => p.propietario === jugadorActual && p.etapa !== 'flor');
  if (propias.length === 0) return null;
  const elegida = propias[Math.floor(Math.random() * propias.length)];
  elegida.regadas += 1;
  actualizarEtapa(elegida);
  return `Racha de suerte para ${jugadorActual}: su parcela (${elegida.fila}, ${elegida.columna}) creció gratis.`;
}

function contarFlores(huerto: Parcela[], jugador: IdJugador): number {
  return huerto.filter((p) => p.propietario === jugador && p.etapa === 'flor').length;
}

function finalizarSiCorresponde(partida: Partida): void {
  if (partida.turnosRestantes <= 0) {
    partida.estado = 'finalizada';
    const flores1 = contarFlores(partida.huerto, 'jugador1');
    const flores2 = contarFlores(partida.huerto, 'jugador2');
    if (flores1 > flores2) partida.ganador = 'jugador1';
    else if (flores2 > flores1) partida.ganador = 'jugador2';
    else partida.ganador = 'empate';
    partida.ultimoMensaje = `Partida finalizada. ${
      partida.ganador === 'empate'
        ? 'Empate'
        : `Gana ${partida.ganador} con ${Math.max(flores1, flores2)} flor(es)`
    }.`;
  }
}

function error(partida: Partida, mensaje: string): RespuestaAccion {
  return { exito: false, mensaje, partida };
}

function exito(partida: Partida, mensaje: string): RespuestaAccion {
  partida.ultimoMensaje = mensaje;
  return { exito: true, mensaje, partida };
}

export function aplicarAccion(partida: Partida, solicitud: SolicitudAccion): RespuestaAccion {
  const { jugador, tipo } = solicitud;

  if (partida.estado === 'finalizada') {
    return error(partida, 'La partida ya finalizó. No se aceptan más acciones.');
  }
  if (jugador !== 'jugador1' && jugador !== 'jugador2') {
    return error(partida, 'Jugador inválido.');
  }
  if (partida.turno !== jugador) {
    return error(partida, `No es tu turno. Le corresponde a ${partida.turno}.`);
  }

  const rival: IdJugador = jugador === 'jugador1' ? 'jugador2' : 'jugador1';
  const datosJugador = partida.jugadores[jugador];
  let mensajeExito = '';

  if (tipo === 'plantar') {
    const { fila, columna } = solicitud;
    if (fila === undefined || columna === undefined || !dentroDelTablero(fila, columna)) {
      return error(partida, 'Debes indicar una parcela válida dentro del tablero.');
    }
    const parcela = partida.huerto[indice(fila, columna)];
    if (territorioDe(columna) !== jugador) {
      return error(partida, 'Solo puedes plantar en tu propio territorio.');
    }
    if (parcela.etapa !== 'vacio' || parcela.propietario !== null) {
      return error(partida, 'Esa parcela ya está ocupada.');
    }
    if (datosJugador.agua < COSTO_PLANTAR) {
      return error(partida, `No tienes suficiente agua para plantar (necesitas ${COSTO_PLANTAR}).`);
    }
    datosJugador.agua -= COSTO_PLANTAR;
    parcela.propietario = jugador;
    parcela.regadas = 0;
    actualizarEtapa(parcela);
    mensajeExito = `${jugador} plantó una semilla en (${fila}, ${columna}).`;
  } else if (tipo === 'regar') {
    const { fila, columna } = solicitud;
    if (fila === undefined || columna === undefined || !dentroDelTablero(fila, columna)) {
      return error(partida, 'Debes indicar una parcela válida dentro del tablero.');
    }
    const parcela = partida.huerto[indice(fila, columna)];
    if (parcela.propietario !== jugador) {
      return error(partida, 'Solo puedes regar tus propias plantas.');
    }
    if (parcela.etapa === 'flor') {
      return error(partida, 'Esa planta ya está completamente florecida.');
    }
    const costo = parcela.especial === 'seca' ? COSTO_REGAR_SECA : COSTO_REGAR_NORMAL;
    if (datosJugador.agua < costo) {
      return error(partida, `No tienes suficiente agua para regar (necesitas ${costo}).`);
    }
    datosJugador.agua -= costo;
    parcela.regadas += 1;
    actualizarEtapa(parcela);
    const etapaFinal: string = parcela.etapa;
    mensajeExito =
      etapaFinal === 'flor'
        ? `¡La planta de ${jugador} en (${fila}, ${columna}) floreció por completo!`
        : `${jugador} regó la parcela (${fila}, ${columna}). Ahora está en etapa "${parcela.etapa}".`;
  } else if (tipo === 'robar_agua') {
    const { fila, columna } = solicitud;
    if (fila === undefined || columna === undefined || !dentroDelTablero(fila, columna)) {
      return error(partida, 'Debes indicar la parcela rival que quieres sabotear.');
    }
    const parcelaObjetivo = partida.huerto[indice(fila, columna)];
    if (parcelaObjetivo.propietario !== rival) {
      return error(partida, 'Esa parcela no pertenece a tu rival.');
    }
    if (parcelaObjetivo.etapa === 'vacio') {
      return error(partida, 'Esa parcela rival todavía no tiene ninguna planta que sabotear.');
    }
    if (datosJugador.agua < COSTO_INTENTO_ROBO) {
      return error(partida, `Necesitas al menos ${COSTO_INTENTO_ROBO} de agua para intentar el sabotaje.`);
    }
    datosJugador.agua -= COSTO_INTENTO_ROBO;
    // El sabotaje es un golpe severo: la planta rival vuelve a ser una semilla
    // sin importar en qué etapa estaba, y tú te llevas agua como recompensa.
    parcelaObjetivo.regadas = 0;
    actualizarEtapa(parcelaObjetivo);
    datosJugador.agua += GANANCIA_SABOTAJE;
    mensajeExito = `${jugador} saboteó la parcela (${fila}, ${columna}): ¡la planta de ${rival} volvió a ser una semilla!`;
  } else if (tipo === 'pasar') {
    datosJugador.agua += GANANCIA_DESCANSO;
    mensajeExito = `${jugador} descansó y recuperó ${GANANCIA_DESCANSO} de agua.`;
  } else if (tipo === 'ahuyentar') {
    const { fila, columna } = solicitud;
    if (fila === undefined || columna === undefined || !dentroDelTablero(fila, columna)) {
      return error(partida, 'Debes indicar la parcela donde está la plaga.');
    }
    const indicePlaga = partida.plagas.findIndex((p) => p.fila === fila && p.columna === columna);
    if (indicePlaga === -1) {
      return error(partida, 'Ahí no hay ninguna plaga que ahuyentar.');
    }
    if (datosJugador.agua < COSTO_AHUYENTAR) {
      return error(partida, `Necesitas al menos ${COSTO_AHUYENTAR} de agua para ahuyentar la plaga.`);
    }
    datosJugador.agua -= COSTO_AHUYENTAR;
    partida.plagas.splice(indicePlaga, 1);
    mensajeExito = `${jugador} ahuyentó una plaga antes de que hiciera daño.`;
  } else {
    return error(partida, `Tipo de acción desconocido: ${tipo}.`);
  }

  partida.turnosRestantes -= 1;
  partida.turno = rival;
  if (tipo !== 'ahuyentar') {
    const mensajePlaga = actualizarPlagas(partida);
    if (mensajePlaga) {
      mensajeExito = `${mensajeExito} · ${mensajePlaga}`;
    }
    const mensajeEvento = dispararEvento(partida, jugador);
    if (mensajeEvento) {
      mensajeExito = `${mensajeExito} · ${mensajeEvento}`;
    }
  }
  finalizarSiCorresponde(partida);
  return exito(partida, mensajeExito);
}

function dentroDelTablero(fila: number, columna: number): boolean {
  return fila >= 0 && fila < FILAS && columna >= 0 && columna < COLUMNAS;
}
