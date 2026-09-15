// Frases cortas con actitud para los momentos más emocionales del juego.
// Sin emojis, tono casual, pensado para que generen una reacción entre dos
// personas jugando juntas (ese "¡oye, eso no se vale!" que hace que se
// quiera jugar otra ronda).

function elegir(frases: string[]): string {
  return frases[Math.floor(Math.random() * frases.length)];
}

const FRASES_SABOTAJE = [
  'Golpe bajo, pero válido.',
  'Ni lo vio venir.',
  'Eso va a doler en la revancha.',
  'Juego sucio, resultados limpios.',
  'Directo a la raíz.',
];

const FRASES_MORDIDA_PLAGA = [
  'La plaga comió bien hoy.',
  'RIP esa planta.',
  'Nadie estaba cuidando esa esquina.',
  'La plaga no perdona.',
];

const FRASES_VICTORIA = ['GG. Rivalidad oficialmente iniciada.', 'Corona del huerto entregada.', 'Así se juega.'];

const FRASES_NUEVO_RECORD = [
  'Nuevo récord. Que alguien tome nota.',
  'Marca personal superada.',
  'Eso no se veía todos los días.',
];

const FRASES_EMPATE = ['Empate técnico. Esto se define en la revancha.', 'Nadie cede terreno.'];

export function fraseSabotaje(): string {
  return elegir(FRASES_SABOTAJE);
}

export function fraseMordidaPlaga(): string {
  return elegir(FRASES_MORDIDA_PLAGA);
}

export function fraseVictoria(): string {
  return elegir(FRASES_VICTORIA);
}

export function fraseNuevoRecord(): string {
  return elegir(FRASES_NUEVO_RECORD);
}

export function fraseEmpate(): string {
  return elegir(FRASES_EMPATE);
}
