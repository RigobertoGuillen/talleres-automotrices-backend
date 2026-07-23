const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Vehículos Endpoints', () => {
  let token;
  let clienteId;
  let vehiculoId;
  let toyotaId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error('No se pudo obtener el token: ' + JSON.stringify(response.body));
    }

    const clienteRes = await pool.query(`
      INSERT INTO clientes (dni, primer_nombre, primer_apellido, segundo_apellido, telefono, correo)
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (dni) DO UPDATE SET primer_nombre = EXCLUDED.primer_nombre
      RETURNING id
    `, ['0801199900001', 'Cliente', 'Test', 'Vehiculo', '9999-9999', 'test_cliente_vehiculo@sigta.com']);

    clienteId = clienteRes.rows[0].id;

    const marcaRes = await pool.query(`SELECT id FROM marcas_vehiculo WHERE nombre = 'Toyota' LIMIT 1`);
    toyotaId = marcaRes.rows[0].id;
  });

  afterAll(async () => {
    try {
      if (vehiculoId) {
        await pool.query('DELETE FROM vehiculos WHERE id = $1', [vehiculoId]);
      }
      if (clienteId) {
        await pool.query('DELETE FROM clientes WHERE id = $1', [clienteId]);
      }
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end();
    }
  });

  test('GET /api/vehiculos - debería devolver lista de vehículos', async () => {
    const response = await request(app)
      .get('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/vehiculos/marcas - debería retornar el listado de marcas', async () => {
    const response = await request(app)
      .get('/api/vehiculos/marcas')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.some((m) => m.nombre === 'Toyota')).toBe(true);
  });

  test('POST /api/vehiculos - debería registrar un vehículo exitosamente', async () => {
    const placaUnica = `H${Math.floor(1000 + Math.random() * 9000)}`;

    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: placaUnica,
        marca_id: toyotaId,
        modelo: '22R',
        anio: 2015,
        color: 'Rojo',
        tipo: 'Pickup',
        cliente_id: clienteId
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('placa', placaUnica);

    vehiculoId = response.body.data.id;
  });

  test('POST /api/vehiculos - debería devolver 400 si faltan campos obligatorios', async () => {
    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HBA1111',
        marca_id: toyotaId
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/vehiculos - debería devolver 400 si el año es menor a 1950 o absurdo', async () => {
    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HBA2222',
        marca_id: toyotaId,
        modelo: 'Civic',
        anio: 1940,
        tipo: 'turismo',
        cliente_id: clienteId
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Año inválido');
  });

  test('POST /api/vehiculos - debería devolver 400 si el tipo no es Pickup, turismo o camioneta', async () => {
    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HBA3333',
        marca_id: toyotaId,
        modelo: 'Cruiser',
        anio: 2020,
        tipo: 'Motocicleta',
        cliente_id: clienteId
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Tipo de vehículo inválido');
  });

  test('GET /api/vehiculos/:id - debería obtener los datos de un vehículo específico', async () => {
    const response = await request(app)
      .get(`/api/vehiculos/${vehiculoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(vehiculoId);
  });

  test('GET /api/vehiculos/buscar - debería filtrar vehículos por coincidencia de query', async () => {
    const response = await request(app)
      .get('/api/vehiculos/buscar')
      .query({ q: '22R' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('PUT /api/vehiculos/:id - debería actualizar datos del vehículo', async () => {
    const response = await request(app)
      .put(`/api/vehiculos/${vehiculoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HCHANGED',
        marca_id: toyotaId,
        modelo: '22R Modified',
        anio: 2016,
        color: 'Azul',
        tipo: 'Pickup',
        cliente_id: clienteId
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.color).toBe('Azul');
    expect(response.body.data.modelo).toBe('22R Modified');
  });

  test('GET /api/vehiculos/:id/historial - debería traer el historial de órdenes de trabajo', async () => {
    const response = await request(app)
      .get(`/api/vehiculos/${vehiculoId}/historial`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/vehiculos/:id - debería devolver 404 si el vehículo no existe', async () => {
    const idInexistente = 999999;
    const response = await request(app)
      .get(`/api/vehiculos/${idInexistente}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});