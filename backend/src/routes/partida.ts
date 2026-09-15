import { Router, Request, Response } from 'express';
import { crearPartida, aplicarAccion } from '../logic/huerto';
import { Partida, SolicitudAccion } from '../types';

const router = Router();

// Almacenamiento en memoria del servidor. Se reinicia si el proceso se reinicia.
const partidas = new Map<string, Partida>();

function generarId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// POST /api/partida -> crea una nueva partida y devuelve su estado inicial
router.post('/', (_req: Request, res: Response) => {
  const id = generarId();
  const partida = crearPartida(id);
  partidas.set(id, partida);
  res.status(201).json(partida);
});

// GET /api/partida/:id -> devuelve el estado actual de la partida
router.get('/:id', (req: Request, res: Response) => {
  const partida = partidas.get(req.params.id);
  if (!partida) {
    return res.status(404).json({ mensaje: 'Partida no encontrada.' });
  }
  res.json(partida);
});

// POST /api/partida/:id/accion -> aplica una acción de un jugador
router.post('/:id/accion', (req: Request, res: Response) => {
  const partida = partidas.get(req.params.id);
  if (!partida) {
    return res.status(404).json({ mensaje: 'Partida no encontrada.' });
  }
  const solicitud = req.body as SolicitudAccion;
  if (!solicitud || !solicitud.jugador || !solicitud.tipo) {
    return res.status(400).json({ mensaje: 'Solicitud inválida: falta jugador o tipo de acción.' });
  }
  const resultado = aplicarAccion(partida, solicitud);
  res.status(resultado.exito ? 200 : 400).json(resultado);
});

export default router;
