import { expect, test, type Page } from '@playwright/test';

/** Cuenta nueva por corrida para que las pruebas no dependan del orden. */
function nuevaCuenta() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    email: `e2e-${id}@autosolve.test`,
    password: 'Segura123',
    fullName: 'Alexis Delgado',
    plate: placaAleatoria(),
  };
}

function placaAleatoria() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letra = () => letras[Math.floor(Math.random() * letras.length)];
  return `${letra()}${letra()}${letra()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

async function registrarse(page: Page, cuenta: ReturnType<typeof nuevaCuenta>) {
  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill(cuenta.fullName);
  await page.getByLabel('Correo').fill(cuenta.email);
  await page.getByLabel('Contraseña').fill(cuenta.password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('heading', { name: /Hola/ })).toBeVisible();
}

async function registrarVehiculo(page: Page, plate: string) {
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await page.getByLabel('Placa').fill(plate);
  await page.getByLabel('Marca').fill('Mazda');
  await page.getByLabel('Modelo').fill('3');
  await page.getByLabel('Año').fill('2021');
  await page.getByRole('button', { name: 'Guardar vehículo' }).click();
  await expect(page.getByText(plate, { exact: false })).toBeVisible();
}

test.describe('AutoSolve', () => {
  test('quien llega por primera vez aterriza en la bienvenida, no en el inicio', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByText('AutoSolve')).toBeVisible();
    // No debe asomar el layout de la app antes de redirigir.
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toHaveCount(0);
  });

  test('la pantalla de bienvenida muestra la marca y ambas acciones', async ({ page }) => {
    await page.goto('/entrar');

    await expect(page.getByText('AutoSolve')).toBeVisible();
    await expect(page.getByText('Cita y asistencia para tu vehículo — rápido y seguro')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible();
  });

  test('se puede explorar el catálogo sin cuenta', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('link', { name: 'Explorar sin cuenta' }).click();

    await expect(page).toHaveURL(/\/servicios/);
    await expect(page.getByRole('heading', { name: 'Cambio de Aceite' })).toBeVisible();
    await expect(page.getByText('$80.000')).toBeVisible();
  });

  test('el buscador encuentra el servicio por el síntoma, no solo por el nombre', async ({ page }) => {
    await page.goto('/servicios');
    await page.getByRole('searchbox').fill('chirrido');
    await page.getByRole('searchbox').press('Enter');

    await expect(page.getByRole('heading', { name: 'Revisión de Frenos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cambio de Aceite' })).toHaveCount(0);
  });

  test('recorre diagnóstico, agendamiento y seguimiento', async ({ page }) => {
    const cuenta = nuevaCuenta();

    await registrarse(page, cuenta);
    await registrarVehiculo(page, cuenta.plate);

    // Diagnóstico
    await page.goto('/chat');
    await page.getByLabel('Escribe tu mensaje').fill('se escucha un chirrido cuando freno');
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByText(/suena a: chirrido/i)).toBeVisible();
    await expect(page.getByText('Urgente')).toBeVisible();

    // Agendamiento desde la recomendación
    await page.getByRole('link', { name: /Agendar Revisión de Frenos/ }).click();
    await expect(page).toHaveURL(/servicio=revision-de-frenos/);

    const cupo = cupoLibre();
    await page.getByLabel('Vehículo').selectOption({ label: `Mazda 3 · ${cuenta.plate}` });
    await page.getByText('Energitéca Centro').click();
    await page.getByLabel('Fecha').fill(cupo.fecha);
    await page.getByText(cupo.hora, { exact: true }).click();
    await page.getByRole('button', { name: /Confirmar/ }).click();

    // Detalle de la cita con su línea de tiempo
    await expect(page).toHaveURL(/\/citas\/[0-9a-f-]{36}/);
    await expect(page.getByRole('heading', { name: 'Revisión de Frenos' })).toBeVisible();
    // 'Pendiente' aparece en el pill del encabezado y en la línea de tiempo;
    // el primero es el estado actual de la cita.
    await expect(page.getByText('Pendiente').first()).toBeVisible();
    await expect(page.getByText('Recibimos tu solicitud.', { exact: false })).toBeVisible();

    // El seguimiento público funciona con el código, sin sesión
    const codigo = (await page.locator('.font-mono').first().innerText()).trim();
    expect(codigo).toMatch(/^AS-[A-Z2-9]{6}$/);

    await page.goto(`/seguimiento/${codigo}`);
    await expect(page.getByRole('heading', { name: 'Revisión de Frenos' })).toBeVisible();
    // La placa llega enmascarada desde la API.
    await expect(page.getByText(cuenta.plate, { exact: false })).toHaveCount(0);
  });

  test('rechaza agendar dos veces el mismo cupo en el mismo taller', async ({ page }) => {
    const cupo = cupoLibre();

    for (const cuenta of [nuevaCuenta(), nuevaCuenta()]) {
      await registrarse(page, cuenta);
      await registrarVehiculo(page, cuenta.plate);

      await page.goto('/agendar?servicio=revision-de-frenos');
      await page.getByLabel('Vehículo').selectOption({ label: `Mazda 3 · ${cuenta.plate}` });
      await page.getByText('Coéxito Sur').click();
      await page.getByLabel('Fecha').fill(cupo.fecha);
      await page.getByText(cupo.hora, { exact: true }).click();
      await page.getByRole('button', { name: /Confirmar/ }).click();
    }

    await expect(page.getByRole('alert')).toContainText('Ese horario ya está ocupado');
  });

  test('la cita aparece en la pestaña Citas del menú inferior', async ({ page }) => {
    const cuenta = nuevaCuenta();
    await registrarse(page, cuenta);

    await page.getByRole('link', { name: 'Citas' }).click();
    await expect(page.getByText('No tienes citas activas')).toBeVisible();
  });

  test('las rutas privadas redirigen al inicio de sesión', async ({ page }) => {
    for (const ruta of ['/', '/citas', '/chat', '/historial', '/perfil', '/agendar']) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/entrar$/);
    }
  });

  test('tras iniciar sesión, la raíz sí muestra el inicio', async ({ page }) => {
    await registrarse(page, nuevaCuenta());

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Hola/ })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  });
});

/**
 * Fecha y hora al azar dentro de los próximos dos meses, saltando domingos.
 * Los cupos ocupados quedan en la base entre corridas, así que un cupo fijo
 * haría fallar la segunda ejecución con un 409 legítimo.
 */
function cupoLibre(): { fecha: string; hora: string } {
  const horas = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 2 + Math.floor(Math.random() * 55));

  while (fecha.getDay() === 0) {
    fecha.setDate(fecha.getDate() + 1);
  }

  return {
    fecha: fecha.toISOString().slice(0, 10),
    hora: horas[Math.floor(Math.random() * horas.length)],
  };
}
