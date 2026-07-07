const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Diagnosticos Endpoints', () => {

  let token;
  let ordenId;
  let ordenSecundariaId;
  let diagnosticoId;

  beforeAll(async () => {

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error(
        'No se pudo obtener el token: ' +
        JSON.stringify(response.body)
      );
    }

   await pool.query(
  `DELETE FROM ordenes_trabajo
   WHERE vehiculo_id IN (
      SELECT id FROM vehiculos WHERE placa = $1
   )`,
  ['DIAG-001']
);

await pool.query(
  `DELETE FROM vehiculos WHERE placa = $1`,
  ['DIAG-001']
);

await pool.query(
  `DELETE FROM clientes WHERE dni = $1`,
  ['0801199912345']
);

const cliente = await pool.query(
  `INSERT INTO clientes (
      dni,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      telefono,
      correo
   )
   VALUES ($1,$2,$3,$4,$5,$6,$7)
   RETURNING id`,
  [
    '0801199912345',
    'Cliente',
    '',
    'Diagnostico',
    'Test',
    '9999-0000',
    'cliente.test@gmail.com'
  ]
);

    const marca = await pool.query(`SELECT id FROM marcas_vehiculo LIMIT 1`);

    const vehiculo = await pool.query(
      `INSERT INTO vehiculos (placa, marca_id, modelo, anio, tipo, cliente_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['DIAG-001', marca.rows[0].id, 'Modelo Test', 2020, 'turismo', cliente.rows[0].id]
    );

    const orden = await pool.query(
      `INSERT INTO ordenes_trabajo (vehiculo_id, descripcion_problema)
       VALUES ($1, $2) RETURNING id`,
      [vehiculo.rows[0].id, 'El motor hace ruido']
    );
    ordenId = orden.rows[0].id;

    const ordenSecundaria = await pool.query(
      `INSERT INTO ordenes_trabajo (vehiculo_id, descripcion_problema)
       VALUES ($1, $2) RETURNING id`,
      [vehiculo.rows[0].id, 'Frenos chillan']
    );
    ordenSecundariaId = ordenSecundaria.rows[0].id;

  });

  afterAll(async () => {
    await pool.end();
  });

  test('POST /api/diagnosticos - deberia rechazar sin descripcion_falla', async () => {
    const response = await request(app)
      .post('/api/diagnosticos')
      .set('Authorization', `Bearer ${token}`)
      .send({ orden_id: ordenId });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/diagnosticos - deberia rechazar una orden inexistente', async () => {
    const response = await request(app)
      .post('/api/diagnosticos')
      .set('Authorization', `Bearer ${token}`)
      .send({ orden_id: 999999, descripcion_falla: 'Falla inventada' });

    expect(response.status).toBe(404);
  });

  test('POST /api/diagnosticos - deberia rechazar un estado invalido', async () => {
    const response = await request(app)
      .post('/api/diagnosticos')
      .set('Authorization', `Bearer ${token}`)
      .send({ orden_id: ordenId, descripcion_falla: 'Falla', estado: 'inventado' });

    expect(response.status).toBe(400);
  });

  test('POST /api/diagnosticos - deberia registrar un diagnostico (HU14)', async () => {
    const response = await request(app)
      .post('/api/diagnosticos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orden_id: ordenId,
        descripcion_falla: 'Ruido metalico en el motor al acelerar',
        observaciones: 'Se revisa en frio y en caliente',
        recomendaciones: 'Cambiar banda de distribucion'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.orden_id).toBe(ordenId);
    expect(response.body.data.descripcion_falla).toBe('Ruido metalico en el motor al acelerar');
    expect(response.body.data.estado).toBe('pendiente');
    expect(response.body.data.mecanico_id).not.toBeNull();
    expect(response.body.data).toHaveProperty('fecha_registro');
    expect(response.body.data).toHaveProperty('fecha_actualizacion');

    diagnosticoId = response.body.data.id;
  });

  test('GET /api/diagnosticos/:id - deberia obtener el diagnostico creado', async () => {
    const response = await request(app)
      .get(`/api/diagnosticos/${diagnosticoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(diagnosticoId);
    expect(response.body.data).toHaveProperty('mecanico');
  });

  test('PATCH /api/diagnosticos/:id/observaciones - deberia registrar observaciones (HU15)', async () => {
    const response = await request(app)
      .patch(`/api/diagnosticos/${diagnosticoId}/observaciones`)
      .set('Authorization', `Bearer ${token}`)
      .send({ observaciones: 'Se detecta desgaste adicional en poleas' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.observaciones).toBe('Se detecta desgaste adicional en poleas');
  });

  test('PATCH /api/diagnosticos/:id/observaciones - deberia rechazar observaciones vacias', async () => {
    const response = await request(app)
      .patch(`/api/diagnosticos/${diagnosticoId}/observaciones`)
      .set('Authorization', `Bearer ${token}`)
      .send({ observaciones: '   ' });

    expect(response.status).toBe(400);
  });

  test('PATCH /api/diagnosticos/:id/estado - deberia rechazar un estado invalido (HU16)', async () => {
    const response = await request(app)
      .patch(`/api/diagnosticos/${diagnosticoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'terminado' });

    expect(response.status).toBe(400);
  });

  test('PATCH /api/diagnosticos/:id/estado - deberia actualizar el estado con mensaje de exito (HU16)', async () => {
    const response = await request(app)
      .patch(`/api/diagnosticos/${diagnosticoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en proceso' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/actualizado/i);
    expect(response.body.data.estado).toBe('en proceso');
  });

  test('GET /api/diagnosticos/orden/:ordenId - deberia mostrar el historial de la orden (HU14/HU15/HU17)', async () => {
    const response = await request(app)
      .get(`/api/diagnosticos/orden/${ordenId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].orden_id).toBe(ordenId);
  });

  test('GET /api/diagnosticos/orden/:ordenId - deberia devolver 404 con orden inexistente', async () => {
    const response = await request(app)
      .get(`/api/diagnosticos/orden/999999`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test('GET /api/diagnosticos?estado= - deberia filtrar por estado (HU17)', async () => {
    const response = await request(app)
      .get('/api/diagnosticos?estado=en proceso')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every(d => d.estado === 'en proceso')).toBe(true);
    expect(response.body.data.some(d => d.id === diagnosticoId)).toBe(true);
  });

  test('GET /api/diagnosticos?q= - deberia buscar por texto (HU17)', async () => {
    const response = await request(app)
      .get('/api/diagnosticos?q=metalico')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.some(d => d.id === diagnosticoId)).toBe(true);
  });

  test('GET /api/diagnosticos - deberia ordenar por fecha descendente por defecto (HU17)', async () => {
    await request(app)
      .post('/api/diagnosticos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orden_id: ordenSecundariaId,
        descripcion_falla: 'Pastillas de freno desgastadas'
      });

    const response = await request(app)
      .get('/api/diagnosticos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const fechas = response.body.data.map(d => new Date(d.fecha_registro).getTime());
    const fechasOrdenadas = [...fechas].sort((a, b) => b - a);
    expect(fechas).toEqual(fechasOrdenadas);
  });

  test('PUT /api/diagnosticos/:id - deberia actualizar recomendaciones', async () => {
    const response = await request(app)
      .put(`/api/diagnosticos/${diagnosticoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recomendaciones: 'Cambiar banda y tensor' });

    expect(response.status).toBe(200);
    expect(response.body.data.recomendaciones).toBe('Cambiar banda y tensor');
  });

  test('GET /api/diagnosticos - deberia devolver 401 sin token', async () => {
    const response = await request(app).get('/api/diagnosticos');
    expect(response.status).toBe(401);
  });

});
