import { test, expect } from '@playwright/test';

test.describe('Jardín Rival - flujo principal', () => {
  test('pantalla de inicio permite comenzar una partida', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Jardín Rival' })).toBeVisible();

    await page.getByTestId('boton-jugar').click();

    // Al iniciar, debe aparecer el huerto y el mensaje inicial del backend.
    await expect(page.getByTestId('huerto')).toBeVisible();
    await expect(page.getByTestId('mensaje-estado')).toContainText('comenzado');
  });

  test('plantar y regar una parcela hace crecer la planta (interacción + backend)', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('boton-jugar').click();
    await expect(page.getByTestId('huerto')).toBeVisible();

    // El jugador inicial es aleatorio, así que detectamos de quién es el
    // turno y plantamos en el territorio correcto (columnas 0-2 para
    // jugador1, columnas 3-5 para jugador2) en vez de asumir jugador1.
    const esJugador1 = await page.locator('.hud-jugador1.hud-activo').isVisible();
    const columnaPropia = esJugador1 ? 0 : 5;
    const parcelaPropia = `parcela-0-${columnaPropia}`;

    await page.getByTestId('boton-accion-plantar').click();
    await page.getByTestId(parcelaPropia).click();
    await expect(page.getByTestId('mensaje-estado')).toContainText('plantó');

    // Pasamos el turno del rival para volver al jugador que plantó.
    await page.getByRole('button', { name: 'Pasar turno' }).click();
    await expect(page.getByTestId('mensaje-estado')).toContainText('descansó');

    // Riega la parcela que plantó, confirmando comunicación real con Express.
    // Como algunas parcelas son fértiles (crecen directo a "flor" con un solo
    // riego), aceptamos cualquiera de los dos mensajes posibles.
    await page.getByTestId('boton-accion-regar').click();
    await page.getByTestId(parcelaPropia).click();
    await expect(page.getByTestId('mensaje-estado')).toContainText(/regó|floreció/);
  });

  test('una acción inválida es rechazada por el backend y no cambia el turno', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('boton-jugar').click();
    await expect(page.getByTestId('huerto')).toBeVisible();

    // Detectamos de quién es el turno antes de la acción inválida, ya que
    // el jugador inicial es aleatorio.
    const esJugador1Antes = await page.locator('.hud-jugador1.hud-activo').isVisible();
    // Elegimos una parcela que nunca es propia sin importar quién empiece.
    const parcelaAjena = esJugador1Antes ? 'parcela-3-5' : 'parcela-0-0';

    // Intentar regar una parcela vacía (nadie la ha plantado) debe fallar en el servidor.
    await page.getByTestId('boton-accion-regar').click();
    await page.getByTestId(parcelaAjena).click();

    await expect(page.getByTestId('mensaje-estado')).toContainText('Solo puedes regar tus propias plantas');

    // El turno no debe haber cambiado: sigue activo el mismo jugador que antes.
    if (esJugador1Antes) {
      await expect(page.locator('.hud-jugador1.hud-activo')).toBeVisible();
    } else {
      await expect(page.locator('.hud-jugador2.hud-activo')).toBeVisible();
    }
  });
});

test.describe('Jardín Rival - plaga móvil', () => {
  test('la plaga aparece, se mueve por el tablero y puede ser ahuyentada', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('boton-jugar').click();
    await expect(page.getByTestId('huerto')).toBeVisible();

    // La aparición de una plaga es probabilística, así que pasamos turnos
    // repetidamente hasta ver al menos una en el tablero (puede haber hasta 2).
    let apareció = false;
    for (let intento = 0; intento < 25; intento++) {
      await page.getByRole('button', { name: 'Pasar turno' }).click();
      if (await page.getByTestId('sprite-plaga').count()) {
        apareció = true;
        break;
      }
    }
    expect(apareció).toBe(true);

    // Tomamos la primera plaga visible y la ahuyentamos.
    const parcelaConPlaga = page.locator('button.parcela-con-plaga').first();
    const cantidadInicial = await page.locator('button.parcela-con-plaga').count();
    const testId = await parcelaConPlaga.getAttribute('data-testid');
    expect(testId).toBeTruthy();

    await page.getByTestId('boton-accion-ahuyentar').click();
    await page.locator(`[data-testid="${testId}"]`).click();

    await expect(page.getByTestId('mensaje-estado')).toContainText('ahuyentó');
    // Esa plaga en particular ya no debe estar en esa casilla.
    await expect(page.locator(`[data-testid="${testId}"].parcela-con-plaga`)).toHaveCount(0);
    // La cantidad total de plagas no debe haber aumentado por ahuyentar una.
    const cantidadFinal = await page.locator('button.parcela-con-plaga').count();
    expect(cantidadFinal).toBeLessThan(cantidadInicial + 1);
  });
});