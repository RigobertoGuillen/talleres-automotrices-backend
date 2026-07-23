const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Ordenes de Trabajo Endpoints', () => {
  let token;
  let numeroOrden;
  let numeroOrdenReasignada;
  let mecanicoId;
  let vehiculoId;

  beforeAll(async () => {
    // Obtener token - NO eliminar usuario admin
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

    // Obtener mecánico
    const mecanicoResult = await pool.query(
      "SELECT id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'mecanico') LIMIT 1"
    );
    if (mecanicoResult.rows.length > 0) {
      mecanicoId = mecanicoResult.rows[0].id;
    }

    // Obtener vehículo existente
    const vehiculoResult = await pool.query("SELECT id FROM vehiculos LIMIT 1");
    if (vehiculoResult.rows.length > 0) {
      vehiculoId = vehiculoResult.rows[0].id;
    } else {
      // Si no hay vehículos, crear uno
      const clienteResult = await pool.query("SELECT id FROM clientes LIMIT 1");
      let clienteId = clienteResult.rows[0]?.id;

      if (!clienteId) {
        const newCliente = await pool.query(
          `INSERT INTO clientes (dni, primer_nombre, primer_apellido, segundo_apellido, telefono)
           VALUES ('0801199912345', 'Cliente', 'Prueba', 'Ordenes', '8888-8888')
           RETURNING id`
        );
        clienteId = newCliente.rows[0].id;
      }

      const marcaResult = await pool.query(
        "SELECT id FROM marcas_vehiculo WHERE nombre = 'Toyota' LIMIT 1"
      );
      const marcaId = marcaResult.rows[0].id;

      const newVehiculo = await pool.query(
        `INSERT INTO vehiculos (placa, marca_id, modelo, anio, color, tipo, cliente_id)
         VALUES ('ORD-999', $1, 'Prueba', 2020, 'Blanco', 'turismo', $2)
         RETURNING id`,
        [marcaId, clienteId]
      );
      vehiculoId = newVehiculo.rows[0].id;
    }
  });

  afterAll(async () => {
    try {
      for (const orden of [numeroOrden, numeroOrdenReasignada]) {
        if (!orden) continue;
        
        await pool.query(
          "DELETE FROM factura_detalle WHERE factura_id IN (SELECT id FROM facturas WHERE orden_id = $1)",
          [orden]
        );
        
        await pool.query("DELETE FROM facturas WHERE orden_id = $1", [orden]);
        
        await pool.query("DELETE FROM diagnosticos WHERE orden_id = $1", [orden]);
        
        await pool.query("DELETE FROM historial_estados_orden WHERE orden_id = $1", [orden]);
        
        await pool.query("DELETE FROM ordenes_trabajo WHERE numero_orden = $1", [orden]);
      }
      
      if (vehiculoId) {
        await pool.query("DELETE FROM vehiculos WHERE placa LIKE 'ORD-%'");
      }
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end();
    }
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
    expect(response.body.data).toHaveProperty('numero_orden');
    numeroOrden = response.body.data.numero_orden;
  });

  test('GET /api/ordenes/:id - debería obtener detalle de una orden', async () => {
    const response = await request(app)
      .get(`/api/ordenes/${numeroOrden}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('numero_orden', numeroOrden);
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
      .patch(`/api/ordenes/${numeroOrden}/asignar`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mecanico_id: mecanicoId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('mecanico_id', mecanicoId);
  });

  test('PATCH /api/ordenes/:id/estado - debería actualizar el estado', async () => {
    const response = await request(app)
      .patch(`/api/ordenes/${numeroOrden}/estado`)
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
      .patch(`/api/ordenes/${numeroOrden}/cerrar`)
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

    numeroOrdenReasignada = newOrden.body.data.numero_orden;

    const response = await request(app)
      .patch(`/api/ordenes/${numeroOrdenReasignada}/reasignar`)
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