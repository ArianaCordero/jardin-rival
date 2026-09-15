export type IdJugador = 'jugador1' | 'jugador2';
export type Etapa = 'vacio' | 'semilla' | 'brote' | 'flor';
export type Especial = 'fertil' | 'seca' | null;
export type TipoAccion = 'plantar' | 'regar' | 'robar_agua' | 'pasar' | 'ahuyentar';
export type EstadoPartida = 'en_curso' | 'finalizada';

export interface Plaga {
  fila: number;
  columna: number;
}

export interface Parcela {
  fila: number;
  columna: number;
  propietario: IdJugador | null;
  etapa: Etapa;
  regadas: number;
  especial: Especial;
}

export interface Jugador {
  agua: number;
}

export interface Partida {
  id: string;
  turno: IdJugador;
  turnosRestantes: number;
  estado: EstadoPartida;
  ganador: IdJugador | 'empate' | null;
  huerto: Parcela[];
  plagas: Plaga[];
  jugadores: {
    jugador1: Jugador;
    jugador2: Jugador;
  };
  ultimoMensaje: string;
}

export interface RespuestaAccion {
  exito: boolean;
  mensaje: string;
  partida: Partida;
}
