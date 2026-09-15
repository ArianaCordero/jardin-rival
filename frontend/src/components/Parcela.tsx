import { Parcela as ParcelaTipo } from '../types';

interface Props {
  parcela: ParcelaTipo;
  seleccionable: boolean;
  tienePlaga: boolean;
  regando: boolean;
  onClick: (fila: number, columna: number) => void;
}

function rutaSprite(parcela: ParcelaTipo): string {
  if (parcela.etapa === 'vacio') {
    return parcela.especial === 'fertil'
      ? '/sprites/pasto.png'
      : '/sprites/tierra_arada.png';
  }
  const duenio = parcela.propietario ?? 'jugador1';
  return `/sprites/${duenio}_${parcela.etapa}.png`;
}

export default function Parcela({ parcela, seleccionable, tienePlaga, regando, onClick }: Props) {
  const clases = ['parcela'];
  if (parcela.especial === 'seca' && parcela.etapa === 'vacio') clases.push('parcela-seca');
  if (parcela.especial === 'fertil') clases.push('parcela-fertil');
  if (seleccionable) clases.push('parcela-seleccionable');
  if (tienePlaga) clases.push('parcela-con-plaga');
  if (parcela.propietario === 'jugador1') clases.push('borde-jugador1');
  if (parcela.propietario === 'jugador2') clases.push('borde-jugador2');

  const claseSprite = parcela.etapa === 'vacio' ? 'sprite-planta' : 'sprite-planta con-vida';

  return (
    <button
      type="button"
      className={clases.join(' ')}
      data-testid={`parcela-${parcela.fila}-${parcela.columna}`}
      onClick={() => onClick(parcela.fila, parcela.columna)}
      aria-label={`Parcela fila ${parcela.fila} columna ${parcela.columna}, etapa ${parcela.etapa}${
        tienePlaga ? ', con plaga' : ''
      }`}
      title={
        parcela.especial
          ? `Parcela ${parcela.especial === 'fertil' ? 'fértil (crece más rápido)' : 'seca (riego más costoso)'}`
          : undefined
      }
    >
      <img
        key={`${parcela.fila}-${parcela.columna}-${parcela.etapa}`}
        src={rutaSprite(parcela)}
        alt={`Etapa ${parcela.etapa}`}
        className={claseSprite}
      />
      {tienePlaga && (
        <img src="/sprites/plaga.png" alt="Plaga" className="sprite-plaga" data-testid="sprite-plaga" />
      )}
      {regando && (
        <img
          src="/sprites/icono_agua.png"
          alt=""
          className="sprite-regadera"
          data-testid="sprite-regadera"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
