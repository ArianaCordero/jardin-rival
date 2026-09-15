import express from 'express';
import path from 'path';
import partidaRouter from './routes/partida';

const app = express();
const PUERTO = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());

// API del juego
app.use('/api/partida', partidaRouter);

// El frontend compilado (React) vive en frontend/dist tras `npm run build`.
// Express lo sirve desde el mismo dominio y puerto, como exige el examen.
const rutaFrontend = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(rutaFrontend));

// Cualquier ruta que no sea /api/* devuelve el index de React (SPA).
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(rutaFrontend, 'index.html'));
});

app.listen(PUERTO, () => {
  // eslint-disable-next-line no-console
  console.log(`Jardín Rival escuchando en http://localhost:${PUERTO}`);
});

export default app;
