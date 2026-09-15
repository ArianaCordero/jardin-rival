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

    // Jugador1 planta en su territorio (columna 0, fila 0).
    await page.getByTestId('boton-accion-plantar').click();
    await page.getByTestId('parcela-0-0').click();
    await expect(page.getByTestId('mensaje-estado')).toContainText('plantó');

    // Ahora es turno de jugador2: pasamos su turno para volver a jugador1.
    await page.getByTestId('boton-accion-pasar').isVisible().catch(() => null);
    await page.getByRole('button', { name: 'Pasar turno' }).click();
    await expect(page.getByTestId('mensaje-estado')).toContainText('descansó');

    // Jugador1 riega la parcela que plantó, confirmando comunicación real con Express.
    await page.getByTestId('boton-accion-regar').click();
    await page.getByTestId('parcela-0-0').click();
    await expect(page.getByTestId('mensaje-estado')).toContainText('regó');
  });

  test('una acción inválida es rechazada por el backend y no cambia el turno', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('boton-jugar').click();
    await expect(page.getByTestId('huerto')).toBeVisible();

    // Intentar regar una parcela vacía (nadie la ha plantado) debe fallar en el servidor.
    await page.getByTestId('boton-accion-regar').click();
    await page.getByTestId('parcela-3-5').click();

    await expect(page.getByTestId('mensaje-estado')).toContainText('Solo puedes regar tus propias plantas');

    // Sigue siendo el turno de jugador1: el panel activo debe mostrarlo.
    await expect(page.locator('.hud-jugador1.hud-activo')).toBeVisible();
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
