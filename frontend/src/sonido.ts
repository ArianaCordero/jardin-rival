// Sonidos simples generados con la API nativa Web Audio (osciladores), sin
// archivos de audio externos. Esto evita problemas de licencias de assets y
// mantiene el proyecto sin dependencias adicionales.

let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!contexto) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
    if (!Ctor) return null;
    contexto = new Ctor();
  }
  return contexto;
}

function tono(frecuencia: number, duracionMs: number, tipo: OscillatorType = 'sine', volumen = 0.08): void {
  const ctx = obtenerContexto();
  if (!ctx) return;
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();
  oscilador.type = tipo;
  oscilador.frequency.value = frecuencia;
  ganancia.gain.value = volumen;
  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);
  const ahora = ctx.currentTime;
  ganancia.gain.setValueAtTime(volumen, ahora);
  ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracionMs / 1000);
  oscilador.start(ahora);
  oscilador.stop(ahora + duracionMs / 1000);
}

function secuencia(notas: Array<{ frecuencia: number; retrasoMs: number; duracionMs: number }>, tipo?: OscillatorType): void {
  notas.forEach((nota) => {
    setTimeout(() => tono(nota.frecuencia, nota.duracionMs, tipo), nota.retrasoMs);
  });
}

export function sonidoPlantar(): void {
  secuencia([
    { frecuencia: 440, retrasoMs: 0, duracionMs: 90 },
    { frecuencia: 660, retrasoMs: 70, duracionMs: 120 },
  ]);
}

export function sonidoRegar(): void {
  secuencia([
    { frecuencia: 500, retrasoMs: 0, duracionMs: 80 },
    { frecuencia: 700, retrasoMs: 60, duracionMs: 80 },
    { frecuencia: 900, retrasoMs: 120, duracionMs: 100 },
  ]);
}

export function sonidoSabotaje(): void {
  tono(140, 260, 'sawtooth', 0.1);
}

export function sonidoAhuyentar(): void {
  secuencia([
    { frecuencia: 300, retrasoMs: 0, duracionMs: 70 },
    { frecuencia: 220, retrasoMs: 50, duracionMs: 100 },
  ]);
}

export function sonidoError(): void {
  tono(150, 150, 'square', 0.06);
}

export function sonidoFlor(): void {
  secuencia([
    { frecuencia: 660, retrasoMs: 0, duracionMs: 90 },
    { frecuencia: 880, retrasoMs: 80, duracionMs: 90 },
    { frecuencia: 1100, retrasoMs: 160, duracionMs: 140 },
  ]);
}

export function sonidoVictoria(): void {
  secuencia([
    { frecuencia: 523, retrasoMs: 0, duracionMs: 140 },
    { frecuencia: 659, retrasoMs: 130, duracionMs: 140 },
    { frecuencia: 784, retrasoMs: 260, duracionMs: 140 },
    { frecuencia: 1047, retrasoMs: 400, duracionMs: 260 },
  ]);
}

export function sonidoTictac(): void {
  tono(880, 60, 'square', 0.05);
}
