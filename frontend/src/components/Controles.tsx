import { TipoAccion } from '../types';

interface Props {
  accionSeleccionada: TipoAccion | null;
  onSeleccionarAccion: (tipo: TipoAccion) => void;
  onPasar: () => void;
  deshabilitado: boolean;
}

const ACCIONES: Array<{ tipo: TipoAccion; etiqueta: string; ayuda: string; icono: string }> = [
  {
    tipo: 'plantar',
    etiqueta: 'Plantar',
    ayuda: 'Elige una parcela vacía de tu lado (cuesta 2 de agua)',
    icono: '/sprites/icono_semilla.png',
  },
  {
    tipo: 'regar',
    etiqueta: 'Regar',
    ayuda: 'Elige una de tus plantas para hacerla crecer (cuesta 1 de agua)',
    icono: '/sprites/icono_agua.png',
  },
  {
    tipo: 'robar_agua',
    etiqueta: 'Sabotear',
    ayuda: 'Elige cualquier planta del rival: la hará retroceder de etapa (cuesta 1 de agua, ganas 2)',
    icono: '/sprites/icono_espada.png',
  },
  {
    tipo: 'ahuyentar',
    etiqueta: 'Ahuyentar',
    ayuda: 'Elige la casilla donde ves la plaga antes de que muerda una planta (cuesta 1 de agua)',
    icono: '/sprites/plaga.png',
  },
];

export default function Controles({ accionSeleccionada, onSeleccionarAccion, onPasar, deshabilitado }: Props) {
  return (
    <div className="controles">
      <p className="controles-titulo">Elige una acción y luego toca una parcela</p>
      <div className="controles-botones">
        {ACCIONES.map((a) => (
          <button
            key={a.tipo}
            type="button"
            disabled={deshabilitado}
            data-testid={`boton-accion-${a.tipo}`}
            className={`boton-accion ${accionSeleccionada === a.tipo ? 'boton-accion-activo' : ''}`}
            onClick={() => onSeleccionarAccion(a.tipo)}
            title={a.ayuda}
          >
            <img src={a.icono} alt="" className="icono-boton" aria-hidden="true" />
            <span>{a.etiqueta}</span>
          </button>
        ))}
        <button type="button" disabled={deshabilitado} className="boton-accion boton-pasar" onClick={onPasar}>
          <span>Pasar turno</span>
        </button>
      </div>
      {accionSeleccionada && (
        <p className="controles-ayuda">
          {ACCIONES.find((a) => a.tipo === accionSeleccionada)?.ayuda}
        </p>
      )}
    </div>
  );
}
