const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Módulo de Facturación', () => {
  let token;
  let caiId;
  let ordenTestId;
  let facturaId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ nombre_usuario: 'admin', contrasena: 'admin123' });

    token = response.body.token;
    if (!token) {
      throw new Error('No se pudo obtener el token: ' + JSON.stringify(response.body));
    }

    // Orden 'entregado' creada directo por INSERT (no dispara el trigger,
    // que solo escucha UPDATE) y sin factura todavía, para probar la
    // generación manual sin que el trigger se adelante.
    const ordenResult = await pool.query(`
      INSERT INTO ordenes_trabajo (vehiculo_id, mecanico_id, descripcion_problema, estado, prioridad)
      VALUES (1, 3, 'Test-Facturacion: orden de prueba', 'entregado', 0)
      RETURNING numero_orden
    `);
    ordenTestId = ordenResult.rows[0].numero_orden;

    await pool.query(`
      INSERT INTO orden_servicio (orden_id, servicio_id, tiempo_empleado_minutos, observaciones, precio_aplicado)
      VALUES ($1, 1, 20, 'Servicio de prueba para factura', 500.00)
    `, [ordenTestId]);
  });

  afterAll(async () => {
    try {
      await pool.query('DELETE FROM factura_detalle WHERE factura_id = $1', [facturaId]);
      await pool.query('DELETE FROM facturas WHERE orden_id = $1', [ordenTestId]);
      await pool.query('DELETE FROM orden_servicio WHERE orden_id = $1', [ordenTestId]);
      await pool.query('DELETE FROM ordenes_trabajo WHERE numero_orden = $1', [ordenTestId]);
      if (caiId) await pool.query('DELETE FROM autorizaciones_cai WHERE id = $1', [caiId]);
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end();
    }
  });

  describe('Autorizaciones CAI', () => {
    test('POST /api/facturacion/cai - debería crear una autorización CAI', async () => {
      const response = await request(app)
        .post('/api/facturacion/cai')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cai: 'TESTA1-TESTA2-TESTA3-TESTA4-TESTA5-TESTA6-T1',
          punto_emision: '999-999-99',
          rango_autorizado_inicio: '999-999-99-00000001',
          rango_autorizado_fin: '999-999-99-00000100',
          fecha_limite_emision: '2027-12-31'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.activo).toBe(true);

      caiId = response.body.data.id;
    });

    test('POST /api/facturacion/cai - debería fallar con formato de CAI inválido', async () => {
      const response = await request(app)
        .post('/api/facturacion/cai')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cai: 'formato-invalido',
          punto_emision: '999-999-99',
          rango_autorizado_inicio: '999-999-99-00000001',
          rango_autorizado_fin: '999-999-99-00000100',
          fecha_limite_emision: '2027-12-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('formato');
    });

    test('POST /api/facturacion/cai - debería fallar con rango invertido', async () => {
      const response = await request(app)
        .post('/api/facturacion/cai')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cai: 'TESTB1-TESTB2-TESTB3-TESTB4-TESTB5-TESTB6-T2',
          punto_emision: '999-999-99',
          rango_autorizado_inicio: '999-999-99-00000100',
          rango_autorizado_fin: '999-999-99-00000001',
          fecha_limite_emision: '2027-12-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('mayor');
    });

    test('POST /api/facturacion/cai - debería devolver 403 si no es administrador', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ nombre_usuario: 'alopez', contrasena: 'alopez123' });

      if (loginResponse.status !== 200) {
        console.log('Login de alopez falló:', loginResponse.body);
        return;
      }

      const response = await request(app)
        .post('/api/facturacion/cai')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({
          cai: 'TESTC1-TESTC2-TESTC3-TESTC4-TESTC5-TESTC6-T3',
          punto_emision: '999-999-99',
          rango_autorizado_inicio: '999-999-99-00000001',
          rango_autorizado_fin: '999-999-99-00000100',
          fecha_limite_emision: '2027-12-31'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/facturacion/cai/activo - debería devolver el CAI recién creado como activo y vigente', async () => {
      const response = await request(app)
        .get('/api/facturacion/cai/activo')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(caiId);
    });

    test('GET /api/facturacion/cai - un usuario recepcionista SÍ puede ver la lista de CAI', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ nombre_usuario: 'alopez', contrasena: 'alopez123' });

      if (loginResponse.status !== 200) return;

      const response = await request(app)
        .get('/api/facturacion/cai')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Detalle y generación de factura', () => {
    test('GET /api/facturacion/ordenes/:ordenId/detalle - debería mostrar la vista previa del detalle', async () => {
      const response = await request(app)
        .get(`/api/facturacion/ordenes/${ordenTestId}/detalle`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.yaFacturada).toBe(false);
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.items[0].costo_unitario).toBe('500.00');
      expect(response.body.data.total).toBeCloseTo(575, 2);
    });

    test('POST /api/facturacion/ordenes/:ordenId/generar - debería generar la factura', async () => {
      const response = await request(app)
        .post(`/api/facturacion/ordenes/${ordenTestId}/generar`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura.orden_id).toBe(ordenTestId);
      expect(response.body.data.factura.numero_factura).toBe('999-999-99-00000001');
      expect(parseFloat(response.body.data.factura.total)).toBeCloseTo(575, 2);
      expect(response.body.data.detalle.length).toBe(1);

      facturaId = response.body.data.factura.id;
    });

    test('POST /api/facturacion/ordenes/:ordenId/generar - debería fallar si la orden ya tiene factura', async () => {
      const response = await request(app)
        .post(`/api/facturacion/ordenes/${ordenTestId}/generar`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ya tiene');
    });

    test('GET /api/facturacion/ordenes/:ordenId/detalle - debería mostrar la factura ya generada', async () => {
      const response = await request(app)
        .get(`/api/facturacion/ordenes/${ordenTestId}/detalle`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.yaFacturada).toBe(true);
      expect(response.body.data.factura.id).toBe(facturaId);
    });

    test('POST /api/facturacion/ordenes/:ordenId/generar - debería fallar si la orden no está entregada', async () => {
      const response = await request(app)
        .post('/api/facturacion/ordenes/ORD-4/generar')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('entregado');
    });

    test('GET /api/facturacion/facturas/:id - debería obtener la factura con su detalle', async () => {
      const response = await request(app)
        .get(`/api/facturacion/facturas/${facturaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factura.id).toBe(facturaId);
      expect(response.body.data.detalle.length).toBe(1);
    });

    test('GET /api/facturacion/facturas - debería listar las facturas', async () => {
      const response = await request(app)
        .get('/api/facturacion/facturas')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.some(f => f.id === facturaId)).toBe(true);
    });

    test('POST /api/facturacion/ordenes/:ordenId/generar - debería devolver 403 si no es admin/recepcionista', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ nombre_usuario: 'jmartinez', contrasena: 'jmartinez123' });

      if (loginResponse.status !== 200) {
        console.log('Login de jmartinez falló:', loginResponse.body);
        return;
      }

      const response = await request(app)
        .post(`/api/facturacion/ordenes/${ordenTestId}/generar`)
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Registro de pago', () => {
    test('PATCH /api/facturacion/facturas/:id/pago - debería fallar con un método de pago inválido', async () => {
      const response = await request(app)
        .patch(`/api/facturacion/facturas/${facturaId}/pago`)
        .set('Authorization', `Bearer ${token}`)
        .send({ metodo_pago: 'cheque' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválido');
    });

    test('PATCH /api/facturacion/facturas/:id/pago - debería devolver 404 con una factura inexistente', async () => {
      const response = await request(app)
        .patch('/api/facturacion/facturas/999999/pago')
        .set('Authorization', `Bearer ${token}`)
        .send({ metodo_pago: 'efectivo' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('PATCH /api/facturacion/facturas/:id/pago - debería devolver 403 si no es admin/recepcionista', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ nombre_usuario: 'jmartinez', contrasena: 'jmartinez123' });

      if (loginResponse.status !== 200) return;

      const response = await request(app)
        .patch(`/api/facturacion/facturas/${facturaId}/pago`)
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({ metodo_pago: 'efectivo' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('PATCH /api/facturacion/facturas/:id/pago - debería registrar el pago correctamente', async () => {
      const response = await request(app)
        .patch(`/api/facturacion/facturas/${facturaId}/pago`)
        .set('Authorization', `Bearer ${token}`)
        .send({ metodo_pago: 'tarjeta' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metodo_pago).toBe('tarjeta');
    });

    test('GET /api/facturacion/facturas/:id - debería reflejar el método de pago registrado', async () => {
      const response = await request(app)
        .get(`/api/facturacion/facturas/${facturaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.factura.metodo_pago).toBe('tarjeta');
    });
  });

  describe('Seguridad', () => {
    test('GET /api/facturacion/facturas - debería devolver 401 sin token', async () => {
      const response = await request(app).get('/api/facturacion/facturas');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
