import { Parcela as ParcelaTipo, IdJugador, TipoAccion, Plaga } from '../types';
import Parcela from './Parcela';

interface Props {
  huerto: ParcelaTipo[];
  jugadorEnTurno: IdJugador;
  accionSeleccionada: TipoAccion | null;
  plagas: Plaga[];
  regandoParcela: { fila: number; columna: number } | null;
  onClickParcela: (fila: number, columna: number) => void;
}

const COLUMNAS = 6;

function esSeleccionable(
  parcela: ParcelaTipo,
  jugadorEnTurno: IdJugador,
  accion: TipoAccion | null,
  tienePlaga: boolean
): boolean {
  if (!accion) return false;
  const rival: IdJugador = jugadorEnTurno === 'jugador1' ? 'jugador2' : 'jugador1';
  if (accion === 'plantar') {
    const territorioPropio =
      jugadorEnTurno === 'jugador1' ? parcela.columna < COLUMNAS / 2 : parcela.columna >= COLUMNAS / 2;
    return territorioPropio && parcela.etapa === 'vacio';
  }
  if (accion === 'regar') {
    return parcela.propietario === jugadorEnTurno && parcela.etapa !== 'flor';
  }
  if (accion === 'robar_agua') {
    return parcela.propietario === rival && parcela.etapa !== 'vacio';
  }
  if (accion === 'ahuyentar') {
    return tienePlaga;
  }
  return false;
}

export default function Huerto({
  huerto,
  jugadorEnTurno,
  accionSeleccionada,
  plagas,
  regandoParcela,
  onClickParcela,
}: Props) {
  const filas: ParcelaTipo[][] = [];
  for (let f = 0; f < huerto.length / COLUMNAS; f++) {
    filas.push(huerto.slice(f * COLUMNAS, (f + 1) * COLUMNAS));
  }

  return (
    <div className="huerto-envoltura">
      <div className="huerto" data-testid="huerto" role="grid" aria-label="Huerto compartido">
        {filas.map((fila, indiceFila) => (
          <div className="fila-huerto" role="row" key={indiceFila}>
            {fila.map((parcela) => {
              const tienePlaga = plagas.some((p) => p.fila === parcela.fila && p.columna === parcela.columna);
              const regando =
                regandoParcela !== null &&
                regandoParcela.fila === parcela.fila &&
                regandoParcela.columna === parcela.columna;
              return (
                <Parcela
                  key={`${parcela.fila}-${parcela.columna}`}
                  parcela={parcela}
                  seleccionable={esSeleccionable(parcela, jugadorEnTurno, accionSeleccionada, tienePlaga)}
                  tienePlaga={tienePlaga}
                  regando={regando}
                  onClick={onClickParcela}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
