# Introducción — Jardín Rival

## Propósito del proyecto

Jardín Rival es un juego web de dos jugadores construido para el examen final de
Certificación. El objetivo del proyecto no es acumular código, sino demostrar el
flujo completo de una aplicación full-stack: una acción del jugador modifica el
estado del juego, React presenta el resultado, el frontend se comunica con Express
mediante HTTP/JSON, y el servidor valida y conserva el estado de la partida.

## Experiencia de juego que propone

Dos jugadores comparten un mismo huerto dividido en dos territorios (columnas
izquierdas para jugador1, columnas derechas para jugador2). Por turnos, cada
jugador decide entre:

- Plantar una semilla en su propio territorio.
- Regar una de sus plantas para hacerla crecer.
- Robar agua de una planta rival adyacente a su territorio.
- Pasar el turno para recuperar agua.

El huerto es visible para ambos jugadores en todo momento: no hay información
oculta. La tensión del juego viene de administrar un recurso limitado (el agua)
mientras se decide si conviene expandirse, regar lo ya plantado, o sabotear al
rival. Además, una plaga que aparece y se desplaza sola por el tablero obliga
a los jugadores a reaccionar incluso cuando no es su prioridad inmediata.

## Por qué esta idea

Se eligió un juego de gestión de recursos por turnos (en lugar de un juego de
reflejos o de tablero clásico) porque permite cumplir los nueve lineamientos del
examen con una complejidad técnica manejable: no requiere física de movimiento
continuo ni motores de colisión, pero sí exige que el backend tome decisiones
reales (validar acciones, calcular crecimiento, resolver robos) y que el estado
del juego combine varios tipos de datos relacionados entre sí (posición, etapa de
crecimiento, agua, turno y puntuación).

Es una idea original: no corresponde a ningún ejercicio desarrollado en clase
(tres en raya, buscaminas, adivinanzas, Space Invaders) ni a una modificación de
ellos.
