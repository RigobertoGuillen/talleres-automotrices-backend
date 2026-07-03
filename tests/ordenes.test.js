const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Ordenes de Trabajo Endpoints', () => {
  let token;
  let ordenId;
  let mecanicoId;
  let vehiculoId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });
    token = response.body.token;

    const mecanicoResult = await pool.query(
      "SELECT id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'mecanico') LIMIT 1"
    );
    if (mecanicoResult.rows.length > 0) {
      mecanicoId = mecanicoResult.rows[0].id;
    }

    const vehiculoResult = await pool.query(
      "SELECT id FROM vehiculos LIMIT 1"
    );
    if (vehiculoResult.rows.length > 0) {
      vehiculoId = vehiculoResult.rows[0].id;
    } else {
      const clienteResult = await pool.query("SELECT id FROM clientes LIMIT 1");
      let clienteId = clienteResult.rows[0]?.id;

      if (!clienteId) {
        // La tabla clientes solo tiene id (autogenerado), nombre y telefono
        // como campos obligatorios. No se inserta id manualmente porque es
        // GENERATED ALWAYS AS IDENTITY.
        const newCliente = await pool.query(
          `INSERT INTO clientes (nombre, telefono) 
           VALUES ('Cliente Prueba Ordenes', '8888-8888') 
           RETURNING id`
        );
        clienteId = newCliente.rows[0].id;
      }

      const newVehiculo = await pool.query(
        `INSERT INTO vehiculos (placa, marca, modelo, anio, color, tipo, cliente_id) 
         VALUES ('ORD-999', 'Toyota', 'Prueba', 2020, 'Blanco', 'turismo', $1) 
         RETURNING id`,
        [clienteId]
      );
      vehiculoId = newVehiculo.rows[0].id;
    }
  });

  afterAll(async () => {
    await pool.query("DELETE FROM ordenes_trabajo WHERE vehiculo_id = $1", [vehiculoId]);
    await pool.query("DELETE FROM vehiculos WHERE placa LIKE 'ORD-%'");
  });

  test('POST /api/ordenes - debería crear una orden de trabajo', async () => {
    const response = await request(app)
      .post('/api/ordenes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehiculo_id: vehiculoId,
        descripcion_problema: 'Motor hace ruido al arrancar',
        prioridad: 1
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    ordenId = response.body.data.id;
  });

  test('GET /api/ordenes/:id - debería obtener detalle de una orden', async () => {
    const response = await request(app)
      .get(`/api/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id', ordenId);
  });

  test('GET /api/ordenes?estado=recibido - debería filtrar por estado', async () => {
    const response = await request(app)
      .get('/api/ordenes?estado=recibido')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('PATCH /api/ordenes/:id/asignar - debería asignar un mecánico', async () => {
    if (!mecanicoId) {
      console.warn('No hay mecánicos disponibles, saltando prueba');
      return;
    }

    const response = await request(app)
      .patch(`/api/ordenes/${ordenId}/asignar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mecanico_id: mecanicoId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('mecanico_id', mecanicoId);
  });

  test('PATCH /api/ordenes/:id/estado - debería actualizar el estado', async () => {
    const response = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estado: 'en reparacion',
        notas: 'Iniciando reparación del motor'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('estado', 'en reparacion');
  });

  test('GET /api/ordenes/mecanico/:id - debería listar órdenes de un mecánico', async () => {
    if (!mecanicoId) {
      console.warn('No hay mecánicos disponibles, saltando prueba');
      return;
    }

    const response = await request(app)
      .get(`/api/ordenes/mecanico/${mecanicoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('PATCH /api/ordenes/:id/cerrar - debería cerrar la orden', async () => {
    const response = await request(app)
      .patch(`/api/ordenes/${ordenId}/cerrar`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('estado', 'entregado');
  });

  test('PATCH /api/ordenes/:id/reasignar - debería reasignar la orden', async () => {
    if (!mecanicoId) {
      console.warn('No hay mecánicos disponibles, saltando prueba');
      return;
    }

    const newOrden = await request(app)
      .post('/api/ordenes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehiculo_id: vehiculoId,
        descripcion_problema: 'Orden para reasignar',
        prioridad: 1
      });

    const newOrdenId = newOrden.body.data.id;

    const response = await request(app)
      .patch(`/api/ordenes/${newOrdenId}/reasignar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mecanico_id: mecanicoId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('mecanico_id', mecanicoId);
  });

  test('GET /api/ordenes - debería devolver 401 sin token', async () => {
    const response = await request(app)
      .get('/api/ordenes');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
  });
});