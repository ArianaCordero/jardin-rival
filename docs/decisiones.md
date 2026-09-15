# Decisiones del proyecto — Jardín Rival

## Decisiones técnicas y su justificación

- **Estado en memoria (Map) en el backend, sin base de datos.** Se eligió así
  porque el examen no exige persistencia entre reinicios del servidor y una
  base de datos añadiría complejidad sin aportar a los lineamientos evaluados.
  Riesgo aceptado: si el servidor se reinicia, las partidas en curso se
  pierden. Para la defensa esto no es un problema porque las partidas se crean
  en el momento.

- **Vite en lugar de Create React App.** Vite es una herramienta mínima de
  construcción (permitida explícitamente por el examen) y compila más rápido,
  lo cual ayuda durante la defensa en vivo cuando se pide un cambio y hay que
  reconstruir y desplegar contra el tiempo.

- **Express sirve el `dist/` de Vite como archivos estáticos**, y cualquier
  ruta que no empiece con `/api` devuelve `index.html`. Esto cumple el
  requisito de que frontend y backend funcionen bajo el mismo dominio y
  puerto, sin necesitar un proxy inverso adicional en producción.

- **Modo "hotseat" (mismo dispositivo) en lugar de multijugador en red.** El
  examen permite ambas variantes ("desde el mismo dispositivo, desde
  dispositivos distintos, o contra una estrategia del backend"). Se eligió
  hotseat porque simplifica enormemente la sincronización de estado (no hace
  falta websockets ni polling) y de todas formas obliga a que el backend sea
  la única fuente de verdad del estado del huerto.

- **Todas las validaciones viven en el backend, no en el frontend.** El
  frontend solo sugiere visualmente qué parcelas son válidas (clase CSS
  `parcela-seleccionable`), pero el clic siempre dispara una petición real al
  servidor, que es quien decide si la acción es válida. Esto demuestra que la
  lógica crítica no vive únicamente en el navegador.

## Riesgos técnicos y estrategia para reducirlos

| Riesgo | Mitigación |
|---|---|
| Que el estado del frontend y del backend queden desincronizados tras una acción | Cada respuesta de `POST /accion` devuelve el estado completo de la partida, y el frontend siempre reemplaza su estado local con esa respuesta en vez de calcularlo por su cuenta. |
| Que las pruebas E2E sean frágiles por depender de animaciones CSS | Las aserciones de Playwright esperan por contenido de texto (`mensaje-estado`) en vez de por temporizadores fijos, y la animación de crecimiento no bloquea la interacción. |
| Que el deploy falle por variables de entorno faltantes | El backend usa `process.env.PORT` con un valor por defecto, y el `README.md` documenta explícitamente qué variables configurar en el servicio elegido. |
| Que el cambio solicitado durante la defensa no llegue a producción a tiempo | Se documenta en `docs/investigacion.md` el flujo de publicación automática hacia Render mediante un Deploy Hook disparado desde GitHub Actions en cada push a `main`. |

## Cambios importantes realizados durante el desarrollo

- **Se agregaron nombres personalizados, un marcador de rivalidad
  persistente y frases con actitud en los momentos clave.** El análisis de
  a quién está dirigido el juego (jóvenes de 20-30 años jugando en el mismo
  dispositivo) mostró que faltaba el gancho más simple para querer jugar
  otra ronda: una rivalidad con nombre y memoria. Se agregaron campos de
  nombre en la pantalla de inicio, un marcador de victorias por pareja de
  nombres guardado en el navegador (visible antes y después de cada
  partida), un botón de "Revancha" para reiniciar al instante con los
  mismos dos jugadores, y frases cortas sin emojis para sabotajes, mordidas
  de plaga y nuevos récords, buscando ese efecto de "screw your neighbor"
  que genera reacciones reales entre dos personas jugando juntas.

- **Se agregó un reloj de turno de 20 segundos y un récord persistente.**
  Tras una tercera ronda de feedback, el problema principal ya no era la
  economía ni la falta de amenazas, sino el ritmo: el juego permitía pensar
  indefinidamente cada turno, lo que le quitaba urgencia, y no había ningún
  motivo para volver a jugar una segunda vez. Se inspiró en mecánicas de
  juegos que generan tensión real (reloj de ajedrez, cuenta regresiva estilo
  "Overcooked") y en el gancho de "superar tu récord anterior" (común en
  juegos arcade) para resolver ambos problemas: un reloj visible que pasa el
  turno automáticamente si se agota, y un mejor puntaje guardado en el
  navegador que se muestra en la pantalla de inicio y al finalizar, con aviso
  especial si se logra un nuevo récord.

- **Se permitió hasta 2 plagas simultáneas, con intensidad creciente hacia
  el final de la partida.** Tras una segunda prueba de jugabilidad, la
  sensación seguía siendo repetitiva: con una sola plaga ocasional, la
  mayoría de los turnos se resolvían en "plantar, regar o sabotear" sin
  presión adicional. Se generalizó el campo `plaga` a un arreglo `plagas`
  para soportar varias amenazas moviéndose a la vez, y se aumentó la
  probabilidad de aparición en los últimos 6 turnos, forzando a los
  jugadores a repartir su atención entre expandirse y defenderse
  simultáneamente en la recta final.

- **Se corrigió la orientación de la animación de la regadera**, que
  originalmente vertía agua hacia el lado contrario de la planta.

- **Se rebalanceó la economía del juego tras una prueba de jugabilidad.**
  La primera versión (26 turnos, 12 de agua inicial, sabotaje de bajo costo)
  se sentía lenta y sin tensión: casi nunca faltaba agua, por lo que las
  decisiones no tenían consecuencias reales. Se redujo a 18 turnos y 10 de
  agua inicial, se hizo que el sabotaje regrese la planta rival por completo
  a "semilla" (en vez de solo una etapa), y se agregó un sistema de eventos
  aleatorios (lluvia, sequía, racha de suerte) para que cada partida se
  sienta distinta y con sorpresas genuinas.

- **Se agregó un puntaje visible en tiempo real** (no solo al final de la
  partida) para que el progreso se perciba turno a turno y no solo se
  revele hasta el conteo final.

- **Se agregaron sonidos sintetizados con Web Audio** (sin archivos de
  audio externos) para plantar, regar, sabotear, ahuyentar la plaga,
  florecer y ganar, además de una animación de "sacudida" de pantalla al
  recibir un golpe. El objetivo fue dar más retroalimentación sensorial
  inmediata, que antes solo era visual y se sentía plano.

- **Se agregó una plaga móvil que se desplaza por el tablero de forma
  automática, turno a turno.** En la primera versión, el único "movimiento"
  del juego era el cambio de sprite de una planta al crecer (semilla → brote
  → flor), lo cual no representaba un desplazamiento real por el tablero.
  Se añadió una entidad `plaga` en el estado de la partida que, tras cada
  acción de cualquier jugador, avanza una casilla hacia la planta más
  cercana (de cualquier dueño) y la muerde si la alcanza. Esto refuerza el
  requisito de "elementos en movimiento" con un desplazamiento espacial
  verificable, y añade una acción adicional (`ahuyentar`) que amplía la
  decisión estratégica del jugador: ¿planto, riego, saboteo, o me defiendo
  de la plaga?

- **Se cambió la mecánica de "robar agua" de robar directamente del
  inventario de una parcela específica a robar de la reserva general del
  rival, y finalmente a un sabotaje que retrocede la etapa de crecimiento.**
  La primera versión permitía dejar una parcela con agua "negativa" y
  complicaba la validación sin aportar más estrategia; retroceder la etapa
  es más intuitivo de entender en pantalla y más fácil de explicar durante
  la defensa.

- **Se quitó el requisito de adyacencia para sabotear una parcela rival.**
  La versión original solo permitía sabotear una parcela rival si el
  jugador ya tenía una planta propia junto a ella, lo que en la práctica
  bloqueaba la acción durante buena parte de la partida. Se simplificó para
  que cualquier parcela rival plantada pueda ser el objetivo, manteniendo el
  costo en agua como única restricción.

- **Se rediseñó el layout para usar toda la altura de la pantalla** en lugar
  de un ancho fijo centrado, cumpliendo con el requisito de que el juego
  utilice el área visible del navegador como espacio de juego. Más adelante
  se reemplazaron las tarjetas blancas de estilo "página web" por un HUD
  flotante semi-transparente sobre una escena de granja (casa, árboles,
  animales), para que la interfaz se sienta como un juego y no como un
  formulario.

- **Se reemplazaron las tarjetas blancas tipo "página web" por un HUD
  flotante semi-transparente sobre una escena de fondo.** La primera versión
  usaba tarjetas sólidas con bordes y sombras típicas de una interfaz web
  (paneles de jugador, mensajes de estado, barra de controles), lo que hacía
  que el juego se sintiera como un formulario en vez de un juego. Se cambió a
  chips flotantes semi-transparentes para los datos de cada jugador, un
  mensaje tipo "toast" para el estado de la partida, y una barra inferior
  oscura para las acciones — todo sobre un fondo de pasto con una casa y
  árboles decorativos, para que la pantalla se lea como una escena de juego
  en vez de una página de formulario.

## Registro de uso de IA

_Esta sección debe completarse por el estudiante conforme use asistentes de
IA durante el desarrollo, indicando qué se solicitó, qué respuesta se
incorporó y qué se verificó antes de aceptarla. Ejemplo de formato:_

| Fecha | Herramienta | Qué se solicitó | Qué se incorporó | Qué se verificó |
|---|---|---|---|---|
| (completar) | Claude | Ayuda para diseñar la lógica de crecimiento de plantas y las rutas REST | La estructura de `huerto.ts` y `partida.ts` | Se probaron manualmente todas las acciones (válidas e inválidas) con `curl` antes de conectarlas al frontend |
