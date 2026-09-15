import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Partida, TipoAccion } from './types';
import { crearPartidaRemota, enviarAccion } from './api';
import Huerto from './components/Huerto';
import PanelJugador from './components/PanelJugador';
import Controles from './components/Controles';
import {
  sonidoPlantar,
  sonidoRegar,
  sonidoSabotaje,
  sonidoAhuyentar,
  sonidoError,
  sonidoFlor,
  sonidoVictoria,
  sonidoTictac,
} from './sonido';
import { obtenerMejorPuntaje, registrarResultado, obtenerNombresGuardados, guardarNombres, obtenerMarcador, registrarVictoriaMarcador } from './progreso';
import { fraseSabotaje, fraseMordidaPlaga, fraseVictoria, fraseNuevoRecord, fraseEmpate } from './reacciones';

const SEGUNDOS_POR_TURNO = 20;

function calcularPuntos(partida: Partida, jugador: 'jugador1' | 'jugador2'): number {
  return partida.huerto
    .filter((p) => p.propietario === jugador)
    .reduce((total, p) => total + (p.etapa === 'flor' ? 3 : p.etapa === 'brote' ? 1 : 0), 0);
}

type Pantalla = 'inicio' | 'jugando' | 'finalizada';

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [partida, setPartida] = useState<Partida | null>(null);
  const [accionSeleccionada, setAccionSeleccionada] = useState<TipoAccion | null>(null);
  const [mensaje, setMensaje] = useState<string>('');
  const [esError, setEsError] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [regandoParcela, setRegandoParcela] = useState<{ fila: number; columna: number } | null>(null);
  const [sacudida, setSacudida] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(SEGUNDOS_POR_TURNO);
  const cargandoRef = useRef(false);

  useEffect(() => {
    cargandoRef.current = cargando;
  }, [cargando]);
  const [mejorPuntaje, setMejorPuntaje] = useState(0);
  const [nuevoRecord, setNuevoRecord] = useState(false);
  const [nombre1, setNombre1] = useState('Jugador 1');
  const [nombre2, setNombre2] = useState('Jugador 2');
  const [marcador, setMarcador] = useState({ victorias1: 0, victorias2: 0, empates: 0 });

  useEffect(() => {
    const guardados = obtenerNombresGuardados();
    setNombre1(guardados.nombre1);
    setNombre2(guardados.nombre2);
    setMarcador(obtenerMarcador(guardados.nombre1, guardados.nombre2));
  }, []);

  useEffect(() => {
    setMejorPuntaje(obtenerMejorPuntaje());
  }, []);

  // Reloj de turno: cada jugador tiene un tiempo limitado para actuar. Si se
  // agota, se pasa el turno automáticamente. Esto mantiene el ritmo del juego
  // y evita esperas largas, como un reloj de ajedrez.
  useEffect(() => {
    if (pantalla !== 'jugando' || !partida || partida.estado !== 'en_curso') return;
    setTiempoRestante(SEGUNDOS_POR_TURNO);
    const id = setInterval(() => {
      // Si hay una solicitud en camino (por ejemplo, esperando que el
      // servidor de Render "despierte"), el reloj se congela en vez de
      // seguir bajando, para no comerse una jugada que ya se envió.
      if (cargandoRef.current) return;
      setTiempoRestante((t: number) => {
        const siguiente = t - 1;
        if (siguiente <= 5 && siguiente > 0) sonidoTictac();
        return siguiente < 0 ? 0 : siguiente;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida?.turno, partida?.turnosRestantes, pantalla]);

  useEffect(() => {
    if (tiempoRestante === 0 && pantalla === 'jugando' && partida?.estado === 'en_curso' && !cargando) {
      ejecutarAccion('pasar');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante]);

  function manejarCambioNombre(cual: 1 | 2, valor: string) {
    const n1 = cual === 1 ? valor || 'Jugador 1' : nombre1;
    const n2 = cual === 2 ? valor || 'Jugador 2' : nombre2;
    if (cual === 1) setNombre1(valor);
    else setNombre2(valor);
    guardarNombres(n1, n2);
    setMarcador(obtenerMarcador(n1, n2));
  }

  async function iniciarPartida() {
    setCargando(true);
    try {
      const nueva = await crearPartidaRemota();
      setPartida(nueva);
      setMensaje(nueva.ultimoMensaje);
      setEsError(false);
      setPantalla('jugando');
    } catch (err) {
      setMensaje('No se pudo conectar con el servidor. Intenta de nuevo.');
      setEsError(true);
    } finally {
      setCargando(false);
    }
  }

  async function ejecutarAccion(tipo: TipoAccion, fila?: number, columna?: number) {
    if (!partida) return;
    if (cargando) {
      // Evita que un clic se pierda en silencio si llega mientras la
      // solicitud anterior sigue en camino (por ejemplo, si el servidor de
      // Render está "despertando" y tarda varios segundos en responder).
      setMensaje('Espera, todavía se está procesando tu jugada anterior...');
      return;
    }
    setCargando(true);
    try {
      const respuesta = await enviarAccion(partida.id, partida.turno, tipo, fila, columna);
      let mensajeFinal = respuesta.mensaje;

      if (!respuesta.exito) {
        sonidoError();
      } else if (tipo === 'plantar') {
        sonidoPlantar();
      } else if (tipo === 'regar') {
        if (respuesta.mensaje.includes('floreció')) sonidoFlor();
        else sonidoRegar();
      } else if (tipo === 'robar_agua') {
        sonidoSabotaje();
        mensajeFinal = `${respuesta.mensaje} ${fraseSabotaje()}`;
      } else if (tipo === 'ahuyentar') {
        sonidoAhuyentar();
      }

      if (respuesta.exito && respuesta.mensaje.includes('devoró')) {
        mensajeFinal = `${mensajeFinal} ${fraseMordidaPlaga()}`;
      }

      setPartida(respuesta.partida);
      setMensaje(mensajeFinal);
      setEsError(!respuesta.exito);

      const hayGolpe =
        respuesta.exito &&
        (respuesta.mensaje.includes('saboteó') || respuesta.mensaje.includes('devoró'));
      if (hayGolpe) {
        setSacudida(true);
        setTimeout(() => setSacudida(false), 350);
      }

      if (tipo === 'regar' && respuesta.exito && fila !== undefined && columna !== undefined) {
        setRegandoParcela({ fila, columna });
        setTimeout(() => setRegandoParcela(null), 700);
      }
      if (respuesta.partida.estado === 'finalizada') {
        setPantalla('finalizada');
      }
    } catch (err) {
      setMensaje('Ocurrió un error de comunicación con el servidor.');
      setEsError(true);
    } finally {
      setAccionSeleccionada(null);
      setCargando(false);
    }
  }

  function manejarClickParcela(fila: number, columna: number) {
    if (!accionSeleccionada) {
      setMensaje('Primero elige una acción: plantar, regar, sabotear o ahuyentar.');
      setEsError(true);
      return;
    }
    ejecutarAccion(accionSeleccionada, fila, columna);
  }

  const [fraseResultado, setFraseResultado] = useState('');

  useEffect(() => {
    if (pantalla === 'finalizada' && partida) {
      sonidoVictoria();
      const puntosJ1 = calcularPuntos(partida, 'jugador1');
      const puntosJ2 = calcularPuntos(partida, 'jugador2');
      const puntosGanador = Math.max(puntosJ1, puntosJ2);
      const esRecord = registrarResultado(puntosGanador);
      setNuevoRecord(esRecord);
      if (esRecord) setMejorPuntaje(puntosGanador);

      const nombreGanador =
        partida.ganador === 'empate' ? 'empate' : partida.ganador === 'jugador1' ? nombre1 : nombre2;
      registrarVictoriaMarcador(nombre1, nombre2, nombreGanador);
      setMarcador(obtenerMarcador(nombre1, nombre2));
      setFraseResultado(esRecord ? fraseNuevoRecord() : partida.ganador === 'empate' ? fraseEmpate() : fraseVictoria());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantalla]);

  if (pantalla === 'inicio' || !partida) {
    return (
      <div className="pantalla pantalla-inicio">
        <img src="/sprites/decor_casa.png" alt="" className="escena decor-casa" aria-hidden="true" />
        <img src="/sprites/decor_arbol1.png" alt="" className="escena decor-arbol-a" aria-hidden="true" />
        <img src="/sprites/decor_arbol2.png" alt="" className="escena decor-arbol-b" aria-hidden="true" />
        <img src="/sprites/decor_pino.png" alt="" className="escena decor-pino-a" aria-hidden="true" />
        <img src="/sprites/decor_pino.png" alt="" className="escena decor-pino-b" aria-hidden="true" />
        <img src="/sprites/decor_pozo.png" alt="" className="escena decor-pozo" aria-hidden="true" />
        <img src="/sprites/decor_vaca.png" alt="" className="escena decor-vaca" aria-hidden="true" />
        <img src="/sprites/decor_gallina.png" alt="" className="escena decor-gallina-a" aria-hidden="true" />
        <img src="/sprites/decor_gallina.png" alt="" className="escena decor-gallina-b" aria-hidden="true" />
        <img src="/sprites/decor_granjero.png" alt="" className="escena decor-granjero" aria-hidden="true" />

        <div className="panel-inicio">
          <h1>Jardín Rival</h1>
          <p>
            Dos jugadores comparten un huerto. Planta, riega y haz crecer tus flores antes de que se
            acaben los turnos &mdash; o róbale agua a tu rival para retrasarlo.
          </p>

          <div className="campos-nombres">
            <input
              type="text"
              className="campo-nombre"
              data-testid="campo-nombre1"
              value={nombre1}
              maxLength={16}
              placeholder="Jugador 1"
              onChange={(e: ChangeEvent<HTMLInputElement>) => manejarCambioNombre(1, e.target.value)}
            />
            <span className="vs-nombres">vs</span>
            <input
              type="text"
              className="campo-nombre"
              data-testid="campo-nombre2"
              value={nombre2}
              maxLength={16}
              placeholder="Jugador 2"
              onChange={(e: ChangeEvent<HTMLInputElement>) => manejarCambioNombre(2, e.target.value)}
            />
          </div>

          {(marcador.victorias1 > 0 || marcador.victorias2 > 0 || marcador.empates > 0) && (
            <p className="marcador-rivalidad" data-testid="marcador-rivalidad">
              {nombre1} {marcador.victorias1} — {marcador.victorias2} {nombre2}
              {marcador.empates > 0 ? ` (${marcador.empates} empates)` : ''}
            </p>
          )}

          <ul className="instrucciones">
            <li>Cada acción vale un turno: plantar, regar, sabotear o pasar.</li>
            <li>Tienes 20 segundos por turno &mdash; si se acaba, pasas automáticamente.</li>
            <li>Las parcelas verdes son fértiles (crecen más rápido); las resecas cuestan más agua.</li>
            <li>Pueden aparecer hasta 2 plagas a la vez: ahuyéntalas antes de que muerdan tus plantas.</li>
            <li>Al agotarse los turnos, gana quien tenga más flores completas.</li>
          </ul>
          {mejorPuntaje > 0 && <p className="mejor-puntaje">Mejor puntaje de este navegador: {mejorPuntaje} pts</p>}
          <button
            type="button"
            className="boton-jugar"
            data-testid="boton-jugar"
            onClick={iniciarPartida}
            disabled={cargando}
          >
            {cargando ? 'Preparando huerto...' : 'Jugar'}
          </button>
        </div>
      </div>
    );
  }

  if (pantalla === 'finalizada') {
    const flores1 = partida.huerto.filter((p) => p.propietario === 'jugador1' && p.etapa === 'flor').length;
    const flores2 = partida.huerto.filter((p) => p.propietario === 'jugador2' && p.etapa === 'flor').length;
    const puntosGanador = Math.max(calcularPuntos(partida, 'jugador1'), calcularPuntos(partida, 'jugador2'));
    const nombreGanador =
      partida.ganador === 'empate' ? null : partida.ganador === 'jugador1' ? nombre1 : nombre2;
    return (
      <div className="pantalla pantalla-resultado" data-testid="pantalla-resultado">
        <h1>Fin de la partida</h1>
        <p className="resultado-ganador">{nombreGanador ? `Gana ${nombreGanador}` : 'Empate'}</p>
        <p className="frase-resultado">{fraseResultado}</p>
        <p>
          {nombre1}: {flores1} flores &nbsp;&mdash;&nbsp; {nombre2}: {flores2} flores
        </p>
        <p className="marcador-rivalidad" data-testid="marcador-rivalidad-final">
          {nombre1} {marcador.victorias1} — {marcador.victorias2} {nombre2}
          {marcador.empates > 0 ? ` (${marcador.empates} empates)` : ''}
        </p>
        {nuevoRecord && <p className="nuevo-record">¡Nuevo récord! {puntosGanador} pts</p>}
        <p className="mejor-puntaje">Mejor puntaje de este navegador: {mejorPuntaje} pts</p>
        <button type="button" className="boton-jugar" onClick={iniciarPartida}>
          Revancha
        </button>
      </div>
    );
  }

  return (
    <div className="pantalla pantalla-juego">
      <img src="/sprites/decor_casa.png" alt="" className="escena escena-casa-juego" aria-hidden="true" />
      <img src="/sprites/decor_arbol1.png" alt="" className="escena escena-arbol-juego-a" aria-hidden="true" />
      <img src="/sprites/decor_arbol2.png" alt="" className="escena escena-arbol-juego-b" aria-hidden="true" />
      <img src="/sprites/decor_pino.png" alt="" className="escena escena-pino-juego" aria-hidden="true" />

      <div className="hud-superior">
        <PanelJugador
          id="jugador1"
          nombre={nombre1}
          jugador={partida.jugadores.jugador1}
          huerto={partida.huerto}
          esSuTurno={partida.turno === 'jugador1'}
        />
        <div className="hud-titulo">
          <span className="hud-titulo-juego">Jardín Rival</span>
          <span className="hud-turnos">Turnos: {partida.turnosRestantes}</span>
          <span className={`hud-reloj ${tiempoRestante <= 5 ? 'hud-reloj-urgente' : ''}`}>
            {cargando ? '...' : `${tiempoRestante}s`}
          </span>
        </div>
        <PanelJugador
          id="jugador2"
          nombre={nombre2}
          jugador={partida.jugadores.jugador2}
          huerto={partida.huerto}
          esSuTurno={partida.turno === 'jugador2'}
        />
      </div>

      {mensaje && (
        <p
          className={`toast-mensaje ${esError ? 'toast-error' : ''}`}
          role="status"
          data-testid="mensaje-estado"
        >
          {mensaje}
        </p>
      )}

      <div className={`escenario-tablero ${sacudida ? 'sacudida' : ''}`}>
        <Huerto
          huerto={partida.huerto}
          jugadorEnTurno={partida.turno}
          accionSeleccionada={accionSeleccionada}
          plagas={partida.plagas}
          regandoParcela={regandoParcela}
          onClickParcela={manejarClickParcela}
        />
      </div>

      <Controles
        accionSeleccionada={accionSeleccionada}
        onSeleccionarAccion={setAccionSeleccionada}
        onPasar={() => ejecutarAccion('pasar')}
        deshabilitado={cargando}
      />
    </div>
  );
}
