# Investigación técnica — Jardín Rival

## Pruebas end-to-end (Playwright)

**Herramienta investigada:** Playwright, elegido sobre Cypress porque su modo
headless en GitHub Actions es más estable en runners de Linux sin
configuración adicional, y porque su instalación (`npx playwright install
--with-deps`) resuelve automáticamente las dependencias del navegador en el
runner de CI.

**Fuentes consultadas:** documentación oficial de Playwright
(playwright.dev), específicamente las secciones "Getting started", "CI" y
"Locators".

**Cómo se ejecutan localmente:** con `npm run test` dentro de la carpeta
`e2e/`, apuntando por defecto a `http://localhost:4000` (el backend debe estar
corriendo con el frontend ya compilado). Para verlas de forma visual en
Chrome, se usa `npm run test:headed`.

**Cómo se ejecutan en GitHub Actions:** el workflow `.github/workflows/e2e.yml`
construye el backend y el frontend, levanta el servidor Express, espera a que
responda con `wait-on`, e instala Chromium headless antes de correr las
pruebas.

**Limitaciones encontradas:**
- Las pruebas comparten un mismo servidor en memoria; si se corren en paralelo
  contra la misma instancia, las partidas de una prueba podrían interferir con
  otra. Por eso `fullyParallel` está desactivado en `playwright.config.ts` y
  cada prueba crea su propia partida nueva.
- Ejecutar las pruebas contra la aplicación ya publicada (`URL_BASE` apuntando
  a la URL de producción) requiere que el servicio esté despierto; en planes
  gratuitos de algunos proveedores el primer request puede tardar varios
  segundos por "cold start".

## Publicación (despliegue)

**Servicio elegido:** Render (https://render.com/), siguiendo la
recomendación del examen.

**Estrategia:** Render se configura como "Web Service" apuntando al
repositorio de GitHub, con:
- **Build command:** `npm install && npm run build --prefix backend && npm run build --prefix frontend`
- **Start command:** `npm run start --prefix backend`
- **Puerto:** Render inyecta automáticamente la variable `PORT`, que el
  backend ya lee (`process.env.PORT`).

**Variables de entorno necesarias:** ninguna obligatoria además de `PORT`
(provista por Render). Si se agregara persistencia en el futuro, aquí se
documentaría la cadena de conexión.

**Publicación automática:** en vez de depender únicamente del auto-deploy de
Render al detectar un push, se configuró un "Deploy Hook" (Render > Settings
> Deploy Hook) guardado como secreto `RENDER_DEPLOY_HOOK` en GitHub. El
workflow `.github/workflows/deploy.yml` lo dispara con un `curl -X POST` en
cada push a `main`, lo que deja un resultado verificable en la pestaña
Actions del repositorio, independientemente de la configuración del panel de
Render.

**Docker:** no se utilizó. Render puede construir y correr un proyecto
Node.js sin contenedor a partir del build/start command, y como el proyecto
no depende de binarios adicionales del sistema, Docker no aportaba beneficio
para este caso y sí añadía una capa más de configuración a mantener durante
la defensa.
