# Reglas — Jardín Rival

## Jugadores

Exactamente 2 jugadores: `jugador1` y `jugador2`, en el mismo dispositivo,
alternando turnos en la misma pantalla (modo "hotseat"). Quién empieza la
partida se decide al azar cada vez, para que ningún jugador tenga siempre la
ventaja de mover primero.

## El huerto

Grid de 4 filas x 6 columnas (24 parcelas). Las columnas 0, 1 y 2 son territorio
de `jugador1`; las columnas 3, 4 y 5 son territorio de `jugador2`.

Al crear la partida, el backend marca aleatoriamente algunas parcelas como
especiales:
- **Fértil**: solo necesita 1 riego para llegar a la etapa "flor" (en vez de 2).
- **Seca**: cada riego cuesta 2 de agua en vez de 1.

Esto aporta variabilidad: cada partida nueva tiene distintas parcelas especiales
en distintas posiciones.

## Recursos iniciales

Cada jugador comienza con 10 unidades de agua. La partida dura 18 turnos en
total (contados de forma compartida entre ambos jugadores) — se acortó
deliberadamente frente a versiones anteriores para que cada decisión pese más
y las partidas se sientan más tensas de principio a fin.

## Eventos aleatorios

Después de cada acción (salvo "ahuyentar"), existe una probabilidad de que
ocurra un evento que afecta la partida, además del movimiento de la plaga:

- **Lluvia**: ambos jugadores ganan 2 de agua.
- **Sequía**: ambos jugadores pierden 1 de agua.
- **Racha de suerte**: una parcela propia del jugador que acaba de jugar
  (que no esté ya en flor) avanza una etapa gratis.

Esto aporta variabilidad extra: ninguna partida transcurre exactamente igual,
incluso si ambos jugadores repiten la misma estrategia.

## Puntaje en vivo

Además de contar flores completas al final, cada jugador ve un puntaje que se
actualiza en tiempo real durante la partida: una parcela en "brote" vale 1
punto y una parcela en "flor" vale 3 puntos. Esto da una sensación de progreso
constante en lugar de que todo se decida solo al final.

## Reloj de turno

Cada jugador tiene **20 segundos** para actuar en su turno, mostrados en un
contador junto al título. Si el tiempo se agota, el turno pasa
automáticamente (equivalente a jugar "pasar"), igual que un reloj de ajedrez.
Esto mantiene el ritmo del juego, evita esperas largas y añade presión real a
cada decisión. El contador se pone en rojo y pulsa cuando quedan 5 segundos o
menos.

## Récord persistente

El navegador recuerda el mejor puntaje alcanzado por un ganador entre
partidas (usando almacenamiento local del navegador), y lo muestra en la
pantalla de inicio y al finalizar una partida, con un aviso especial si se
logra un nuevo récord. Esto incentiva jugar más de una vez para intentar
superar la marca anterior.

## Nombres personalizados y marcador de rivalidad

Antes de jugar, cada persona puede escribir su nombre en dos campos de texto
("Carla vs Diego", por ejemplo). Esos nombres se guardan en el navegador y se
usan en todo el HUD en vez de "Jugador 1" / "Jugador 2". Además, el juego
lleva un marcador de victorias entre esa pareja de nombres específica
(independiente de quién sea "jugador1" o "jugador2" en una partida dada), que
se muestra tanto en la pantalla de inicio como al finalizar cada partida.
Esto convierte partidas sueltas en una rivalidad con memoria, y el botón
"Revancha" al terminar permite arrancar otra partida al instante con la misma
pareja de jugadores.

También se muestran frases cortas con actitud (sin depender de emojis) en
momentos clave como un sabotaje exitoso, una plaga devorando una planta, o
una nueva marca personal, para que esos momentos generen una reacción real
entre las dos personas jugando.

## Etapas de una planta

Cada parcela plantada avanza por tres etapas: `semilla` → `brote` → `flor`.
El número de riegos necesarios para llegar a "flor" depende de si la parcela es
fértil (1 riego) o normal/seca (2 riegos). Una planta en etapa "flor" ya no
necesita más agua y no puede regarse de nuevo.

## Las plagas

Además de las plantas, cada turno existe una probabilidad de que aparezca una
**plaga** en uno de los bordes del huerto. Puede haber **hasta 2 plagas
simultáneas** en el tablero. Mientras existan, en cada turno cada plaga **se
desplaza una casilla** en dirección a la planta más cercana de cualquier
jugador (movimiento real por turnos, no solo un cambio de sprite). Si una
plaga llega exactamente a una parcela plantada, la devora por completo (la
planta vuelve a "semilla") y esa plaga desaparece.

En los últimos 6 turnos de la partida, la probabilidad de que aparezca una
nueva plaga aumenta, para que el final se sienta más caótico y obligue a los
jugadores a repartir su atención entre expandirse, regar, sabotear y
defenderse al mismo tiempo.

Este es el elemento de movimiento más visible del juego: las plagas cambian
de posición turno a turno de forma visible para ambos jugadores, de forma
independiente a las acciones que ellos elijan.

## Acciones disponibles (una por turno)

1. **Plantar** (`plantar`): elige una parcela vacía dentro de tu propio
   territorio. Cuesta 2 de agua. La parcela pasa a ser tuya, en etapa "semilla".
2. **Regar** (`regar`): elige una parcela propia que no esté en etapa "flor".
   Cuesta 1 de agua (2 si la parcela es "seca"). Avanza su crecimiento.
3. **Sabotear planta rival** (`robar_agua`): elige cualquier parcela del
   rival que ya tenga una planta (no puede estar vacía). Cuesta 1 de agua
   como "costo de intento". Si tiene éxito, la planta rival **vuelve por
   completo a la etapa "semilla"**, sin importar en qué etapa estaba, y tú
   ganas 2 de agua como recompensa. Es un golpe severo: úsalo con criterio,
   porque también gasta tu turno.
4. **Ahuyentar plaga** (`ahuyentar`): solo disponible si hay una plaga en el
   tablero. Elige exactamente la casilla donde está la plaga. Cuesta 1 de
   agua. Si tiene éxito, la plaga desaparece sin morder ninguna planta ese
   turno.
5. **Pasar** (`pasar`): no requiere parcela. Recuperas 1 de agua ("descanso").

Nota: la plaga se mueve automáticamente después de cualquier acción que **no**
sea "ahuyentar" (si la acción fue plantar, regar, sabotear o pasar). Esto
significa que, aunque el jugador no interactúe directamente con la plaga, ella
sigue avanzando turno a turno hacia las plantas.

## Acciones inválidas (rechazadas por el backend, no consumen turno)

- Plantar en una parcela ocupada o fuera de tu territorio.
- Plantar o regar sin agua suficiente.
- Regar una parcela que no es tuya, o que ya está en etapa "flor".
- Robar agua de una parcela que no es del rival, o que todavía está vacía
  (sin ninguna planta que sabotear).
- Ahuyentar una plaga en una casilla donde no hay ninguna plaga.
- Actuar cuando no es tu turno.
- Actuar después de que la partida ya finalizó.

Cuando una acción es inválida, el servidor responde con `exito: false` y un
mensaje explicando el motivo. El turno no cambia: el mismo jugador puede
intentar otra acción.

## Fin de la partida y condición de victoria

La partida termina cuando se agotan los 26 turnos. En ese momento se cuentan las
parcelas en etapa "flor" de cada jugador:

- Quien tenga más flores completas gana.
- Si ambos tienen la misma cantidad, es empate.

## Decisión estratégica

En cada turno el jugador debe elegir entre expandirse (plantar más parcelas),
consolidar lo que ya tiene (regar hasta florecer) o atacar al rival (robar
agua, arriesgando su propia agua en el intento). No existe una única jugada
dominante: regar demasiado pronto deja sin agua para expandirse, y robar agua
sin suficiente reserva propia puede dejar al jugador vulnerable.
