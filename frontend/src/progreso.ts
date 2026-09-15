// Guarda el mejor puntaje y el número de partidas jugadas en este navegador,
// usando localStorage (persiste entre sesiones en la misma máquina/navegador).
// Esto NO es un artifact de Claude, es la aplicación real ya desplegada, por
// lo que localStorage es apropiado aquí.

const CLAVE_MEJOR_PUNTAJE = 'jardinRival:mejorPuntaje';
const CLAVE_PARTIDAS_JUGADAS = 'jardinRival:partidasJugadas';

export function obtenerMejorPuntaje(): number {
  try {
    const valor = window.localStorage.getItem(CLAVE_MEJOR_PUNTAJE);
    return valor ? parseInt(valor, 10) : 0;
  } catch {
    return 0;
  }
}

export function obtenerPartidasJugadas(): number {
  try {
    const valor = window.localStorage.getItem(CLAVE_PARTIDAS_JUGADAS);
    return valor ? parseInt(valor, 10) : 0;
  } catch {
    return 0;
  }
}

/** Registra el resultado de una partida terminada. Devuelve true si se batió el récord. */
export function registrarResultado(puntajeGanador: number): boolean {
  try {
    const partidas = obtenerPartidasJugadas();
    window.localStorage.setItem(CLAVE_PARTIDAS_JUGADAS, String(partidas + 1));

    const mejorActual = obtenerMejorPuntaje();
    if (puntajeGanador > mejorActual) {
      window.localStorage.setItem(CLAVE_MEJOR_PUNTAJE, String(puntajeGanador));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// --- Nombres de jugadores y marcador de rivalidad ---
// Se guardan los últimos nombres usados, y un marcador de victorias por cada
// pareja de nombres, para que la revancha se sienta como una rivalidad real
// entre las mismas dos personas y no como partidas sueltas sin memoria.

const CLAVE_NOMBRE_1 = 'jardinRival:nombre1';
const CLAVE_NOMBRE_2 = 'jardinRival:nombre2';

export function obtenerNombresGuardados(): { nombre1: string; nombre2: string } {
  try {
    return {
      nombre1: window.localStorage.getItem(CLAVE_NOMBRE_1) || 'Jugador 1',
      nombre2: window.localStorage.getItem(CLAVE_NOMBRE_2) || 'Jugador 2',
    };
  } catch {
    return { nombre1: 'Jugador 1', nombre2: 'Jugador 2' };
  }
}

export function guardarNombres(nombre1: string, nombre2: string): void {
  try {
    window.localStorage.setItem(CLAVE_NOMBRE_1, nombre1 || 'Jugador 1');
    window.localStorage.setItem(CLAVE_NOMBRE_2, nombre2 || 'Jugador 2');
  } catch {
    // Si localStorage no está disponible, simplemente no se guarda el nombre.
  }
}

interface Marcador {
  victorias1: number;
  victorias2: number;
  empates: number;
}

function claveMarcador(nombre1: string, nombre2: string): string {
  // Se ordena alfabéticamente para que el marcador sea el mismo sin importar
  // quién fue "jugador1" o "jugador2" en una partida en particular.
  const [a, b] = [nombre1, nombre2].sort((x, y) => x.localeCompare(y));
  return `jardinRival:marcador:${a}__${b}`;
}

export function obtenerMarcador(nombre1: string, nombre2: string): Marcador {
  try {
    const crudo = window.localStorage.getItem(claveMarcador(nombre1, nombre2));
    if (!crudo) return { victorias1: 0, victorias2: 0, empates: 0 };
    const datos = JSON.parse(crudo) as { [nombre: string]: number } & { empates?: number };
    return {
      victorias1: datos[nombre1] || 0,
      victorias2: datos[nombre2] || 0,
      empates: datos.empates || 0,
    };
  } catch {
    return { victorias1: 0, victorias2: 0, empates: 0 };
  }
}

export function registrarVictoriaMarcador(nombre1: string, nombre2: string, ganador: string | 'empate'): void {
  try {
    const clave = claveMarcador(nombre1, nombre2);
    const actual = obtenerMarcador(nombre1, nombre2);
    const datos: { [nombre: string]: number } = {
      [nombre1]: actual.victorias1,
      [nombre2]: actual.victorias2,
      empates: actual.empates,
    };
    if (ganador === 'empate') datos.empates += 1;
    else datos[ganador] = (datos[ganador] || 0) + 1;
    window.localStorage.setItem(clave, JSON.stringify(datos));
  } catch {
    // Si localStorage no está disponible, el marcador simplemente no se guarda.
  }
}
