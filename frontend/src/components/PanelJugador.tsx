import { Parcela, IdJugador, Jugador } from '../types';

interface Props {
  id: IdJugador;
  nombre: string;
  jugador: Jugador;
  huerto: Parcela[];
  esSuTurno: boolean;
}

export default function PanelJugador({ id, nombre, jugador, huerto, esSuTurno }: Props) {
  const flores = huerto.filter((p) => p.propietario === id && p.etapa === 'flor').length;
  const puntos = huerto
    .filter((p) => p.propietario === id)
    .reduce((total, p) => total + (p.etapa === 'flor' ? 3 : p.etapa === 'brote' ? 1 : 0), 0);

  return (
    <div className={`hud-jugador hud-${id} ${esSuTurno ? 'hud-activo' : ''}`}>
      <span className="hud-nombre" title={nombre}>
        {nombre}
      </span>
      <span className="hud-stat">
        <img src="/sprites/icono_agua.png" alt="Agua" className="icono-agua" />
        {jugador.agua}
      </span>
      <span className="hud-stat">
        <img src={`/sprites/${id}_flor.png`} alt="Flores" className="icono-flor" />
        {flores}
      </span>
      <span className="hud-stat hud-puntos">{puntos} pts</span>
      {esSuTurno && <span className="hud-badge-turno">Tu turno</span>}
    </div>
  );
}
