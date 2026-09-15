# Jardín Rival

Juego web de dos jugadores. Cada uno cultiva flores en un huerto compartido:
planta, riega y hazlas crecer antes de que se acaben los turnos, o róbale agua
a tu rival para retrasarlo. Gana quien tenga más flores completas al final.

Proyecto hecho con **React + TypeScript** (frontend) y **Express +
TypeScript** (backend), sin librerías externas de estado, routing, UI ni
motores de juego — solo React, Express, TypeScript, y CSS propio.

## Requisitos previos

- Node.js 20 o superior
- npm

## Estructura del repositorio

```
jardin-rival/
├── backend/     Servidor Express (lógica del juego + API REST)
├── frontend/    Aplicación React (interfaz del huerto)
├── e2e/         Pruebas end-to-end con Playwright
├── docs/        Documentación de decisiones, reglas e investigación
└── .github/workflows/   Linters, pruebas E2E y deployment
```

## Instalación

Instala las dependencias de cada parte del proyecto por separado:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../e2e && npm install
```

## Ejecutar en desarrollo

En una terminal, levanta el backend:

```bash
cd backend
npm run dev
```

En otra terminal, levanta el frontend (con recarga en caliente):

```bash
cd frontend
npm run dev
```

Abre `http://localhost:5173`. Vite redirige automáticamente las peticiones a
`/api/*` hacia el backend en el puerto 4000 (ver `frontend/vite.config.ts`).

## Ejecutar en producción (un solo puerto)

```bash
cd backend && npm run build
cd ../frontend && npm run build
cd ../backend && npm run start
```

Abre `http://localhost:4000`. Express sirve ahí mismo tanto la API
(`/api/*`) como el frontend ya compilado, cumpliendo con que ambos vivan bajo
el mismo dominio y puerto.

## Ejecutar las pruebas E2E

Con la aplicación corriendo en `http://localhost:4000` (modo producción, ver
arriba):

```bash
cd e2e
npx playwright install --with-deps chromium   # solo la primera vez
npm run test          # modo headless
npm run test:headed   # modo visual en Chrome
```

## Linters

```bash
cd backend && npm run lint
cd ../frontend && npm run lint
```

## Arquitectura y endpoints

Ver `docs/api.md` para el detalle completo de los endpoints REST
(`GET /api/partida/:id`, `POST /api/partida`, `POST /api/partida/:id/accion`)
con ejemplos de solicitudes y respuestas en JSON.

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto en el que escucha el backend (y por lo tanto toda la app) | `4000` |

## Despliegue

La aplicación está pensada para desplegarse en [Render](https://render.com/).
Ver `docs/investigacion.md` para el detalle del proceso de publicación y el
disparo automático mediante GitHub Actions.

**URL publicada:** https://jardin-rival.onrender.com

## Documentación del proyecto

- `docs/introduccion.md` — propósito y experiencia de juego
- `docs/reglas.md` — reglas completas, acciones y condición de victoria
- `docs/api.md` — diseño de la API REST
- `docs/decisiones.md` — decisiones técnicas, riesgos y registro de uso de IA
- `docs/investigacion.md` — investigación de pruebas E2E y publicación

## Créditos de assets

Sprites de plantas y tiles tomados de los packs "RPG Farm" y "Sprout Lands -
Basic pack" (uso según licencia de cada pack, incluida en sus carpetas
originales).
