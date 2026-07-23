const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Módulo de Inventario', () => {
  let token;
  let categoriaId;
  let repuestoId;
  let solicitudId;

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

    await pool.query("DELETE FROM solicitudes_repuestos WHERE repuesto_id IN (SELECT id FROM repuestos WHERE codigo LIKE 'TEST-%')");
    await pool.query("DELETE FROM movimientos_inventario WHERE repuesto_id IN (SELECT id FROM repuestos WHERE codigo LIKE 'TEST-%')");
    await pool.query("DELETE FROM stock_repuestos WHERE repuesto_id IN (SELECT id FROM repuestos WHERE codigo LIKE 'TEST-%')");
    await pool.query("DELETE FROM repuestos WHERE codigo LIKE 'TEST-%'");
    await pool.query("DELETE FROM categorias_repuestos WHERE nombre LIKE 'Test-%'");
  });

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM solicitudes_repuestos WHERE repuesto_id IN (SELECT id FROM repuestos WHERE codigo LIKE 'TEST-%')");
      await pool.query("DELETE FROM movimientos_inventario WHERE repuesto_id IN (SELECT id FROM repuestos WHERE codigo LIKE 'TEST-%')");
      await pool.query("DELETE FROM stock_repuestos WHERE repuesto_id IN (SELECT id FROM repuestos WHERE codigo LIKE 'TEST-%')");
      await pool.query("DELETE FROM repuestos WHERE codigo LIKE 'TEST-%'");
      await pool.query("DELETE FROM categorias_repuestos WHERE nombre LIKE 'Test-%'");
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end();
    }
  });

  describe('Categorías', () => {
    test('POST /api/inventario/categorias - debería crear una categoría', async () => {
      const response = await request(app)
        .post('/api/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Test-Frenos'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nombre).toBe('Test-Frenos');

      categoriaId = response.body.data.id;
    });

    test('POST /api/inventario/categorias - debería fallar sin nombre', async () => {
      const response = await request(app)
        .post('/api/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obligatorio');
    });

    test('GET /api/inventario/categorias - debería listar categorías', async () => {
      const response = await request(app)
        .get('/api/inventario/categorias')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/inventario/categorias/:id - debería obtener una categoría por ID', async () => {
      const response = await request(app)
        .get(`/api/inventario/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(categoriaId);
    });

    test('PUT /api/inventario/categorias/:id - debería actualizar una categoría', async () => {
      const response = await request(app)
        .put(`/api/inventario/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Test-Frenos-Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Test-Frenos-Updated');
    });

    test('DELETE /api/inventario/categorias/:id - debería eliminar una categoría', async () => {
      const response = await request(app)
        .delete(`/api/inventario/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminada');
    });
  });

  describe('Repuestos (HU-27)', () => {
    beforeAll(async () => {
      const response = await request(app)
        .post('/api/inventario/categorias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Test-Repuestos-Cat'
        });

      if (response.status === 201) {
        categoriaId = response.body.data.id;
      }
    });

    test('POST /api/inventario/repuestos - debería registrar un repuesto completo', async () => {
      const response = await request(app)
        .post('/api/inventario/repuestos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          codigo: 'TEST-001',
          nombre: 'Pastillas de freno test',
          categoria_id: categoriaId,
          costo_unitario: 500,
          precio_unitario: 850,
          cantidad_inicial: 50,
          cantidad_minima: 10
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('repuesto');
      expect(response.body.data.repuesto.codigo).toBe('TEST-001');
      expect(response.body.data.stock.cantidad_disponible).toBe(50);

      repuestoId = response.body.data.repuesto.id;
    });

    test('POST /api/inventario/repuestos - debería fallar con código duplicado', async () => {
      const response = await request(app)
        .post('/api/inventario/repuestos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          codigo: 'TEST-001',
          nombre: 'Otro repuesto',
          categoria_id: categoriaId,
          costo_unitario: 500,
          precio_unitario: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe');
    });

    test('POST /api/inventario/repuestos - debería fallar sin campos obligatorios', async () => {
      const response = await request(app)
        .post('/api/inventario/repuestos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Sin código'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/inventario/repuestos - debería listar repuestos', async () => {
      const response = await request(app)
        .get('/api/inventario/repuestos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/inventario/repuestos/buscar - debería buscar repuestos', async () => {
      const response = await request(app)
        .get('/api/inventario/repuestos/buscar?q=freno')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/inventario/repuestos/:id - debería obtener un repuesto', async () => {
      const response = await request(app)
        .get(`/api/inventario/repuestos/${repuestoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(repuestoId);
    });

    test('PUT /api/inventario/repuestos/:id - debería actualizar un repuesto', async () => {
      const response = await request(app)
        .put(`/api/inventario/repuestos/${repuestoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          codigo: 'TEST-001-UPD',
          nombre: 'Pastillas de freno test updated',
          categoria_id: categoriaId,
          costo_unitario: 550,
          precio_unitario: 900
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.codigo).toBe('TEST-001-UPD');
    });
  });

  describe('Stock (HU-29)', () => {
    test('GET /api/inventario/stock - debería consultar stock', async () => {
      const response = await request(app)
        .get('/api/inventario/stock')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/inventario/stock?repuesto_id= - debería consultar stock de un repuesto', async () => {
      const response = await request(app)
        .get(`/api/inventario/stock?repuesto_id=${repuestoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(repuestoId);
      expect(response.body.data.stock).toHaveProperty('cantidad_disponible');
    });

    test('GET /api/inventario/stock?nombre= - debería filtrar por nombre', async () => {
      const response = await request(app)
        .get('/api/inventario/stock?nombre=freno')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Movimientos (HU-28, HU-33)', () => {
    test('POST /api/inventario/movimientos - debería registrar una entrada', async () => {
      const response = await request(app)
        .post('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          repuesto_id: repuestoId,
          tipo_movimiento: 'entrada',
          cantidad: 10,
          motivo: 'Compra a proveedor'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.movimiento.tipo_movimiento).toBe('entrada');
      expect(response.body.data.movimiento.cantidad).toBe(10);
    });

    test('POST /api/inventario/movimientos - debería registrar una salida', async () => {
      const response = await request(app)
        .post('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          repuesto_id: repuestoId,
          tipo_movimiento: 'salida',
          cantidad: 5,
          motivo: 'Uso en taller'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.movimiento.tipo_movimiento).toBe('salida');
      expect(response.body.data.movimiento.cantidad).toBe(5);
    });

    test('POST /api/inventario/movimientos - debería fallar con stock insuficiente', async () => {
      const response = await request(app)
        .post('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          repuesto_id: repuestoId,
          tipo_movimiento: 'salida',
          cantidad: 999,
          motivo: 'Salida masiva'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('insuficiente');
    });

    test('GET /api/inventario/movimientos - debería listar movimientos', async () => {
      const response = await request(app)
        .get('/api/inventario/movimientos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/inventario/movimientos/repuesto/:repuestoId - debería listar movimientos por repuesto', async () => {
      const response = await request(app)
        .get(`/api/inventario/movimientos/repuesto/${repuestoId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Solicitudes (HU-30, HU-31)', () => {
    test('POST /api/inventario/solicitudes - debería crear una solicitud', async () => {
      const response = await request(app)
        .post('/api/inventario/solicitudes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orden_id: 'ORD-1',
          repuesto_id: repuestoId,
          cantidad_solicitada: 3
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.estado).toBe('pendiente');

      solicitudId = response.body.data.id;
    });

    test('POST /api/inventario/solicitudes - debería fallar sin orden', async () => {
      const response = await request(app)
        .post('/api/inventario/solicitudes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          repuesto_id: repuestoId,
          cantidad_solicitada: 3
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/inventario/solicitudes/pendientes - debería listar solicitudes pendientes', async () => {
      const response = await request(app)
        .get('/api/inventario/solicitudes/pendientes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('PATCH /api/inventario/solicitudes/:id/aprobar - debería aprobar una solicitud', async () => {
      const response = await request(app)
        .patch(`/api/inventario/solicitudes/${solicitudId}/aprobar`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          estado: 'aprobada'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('aprobada');
    });

    test('PATCH /api/inventario/solicitudes/:id/aprobar - debería rechazar una solicitud', async () => {
      const createResponse = await request(app)
        .post('/api/inventario/solicitudes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orden_id: 'ORD-1',
          repuesto_id: repuestoId,
          cantidad_solicitada: 2
        });

      const newSolicitudId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/inventario/solicitudes/${newSolicitudId}/aprobar`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          estado: 'rechazada'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estado).toBe('rechazada');
    });

    test('GET /api/inventario/solicitudes/orden/:ordenId - debería listar solicitudes por orden', async () => {
      const response = await request(app)
        .get('/api/inventario/solicitudes/orden/ORD-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Alertas de Stock (HU-32)', () => {
    test('GET /api/inventario/stock/alertas - debería obtener alertas de stock bajo', async () => {
      const response = await request(app)
        .get('/api/inventario/stock/alertas')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('criticas');
      expect(response.body.data).toHaveProperty('medias');
      expect(response.body.data).toHaveProperty('normales');
    });
  });

  describe('Seguridad', () => {
    test('GET /api/inventario/repuestos - debería devolver 401 sin token', async () => {
      const response = await request(app)
        .get('/api/inventario/repuestos');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/inventario/repuestos - debería devolver 401 sin token', async () => {
      const response = await request(app)
        .post('/api/inventario/repuestos')
        .send({
          codigo: 'TEST-002',
          nombre: 'Sin token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('POST /api/inventario/categorias - debería devolver 403 si no es administrador', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          nombre_usuario: 'alopez',
          contrasena: 'alopez123'
        });

      if (loginResponse.status !== 200) {
        console.log('Login de alopez falló:', loginResponse.body);
        return;
      }

      const userToken = loginResponse.body.token;

      const response = await request(app)
        .post('/api/inventario/categorias')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: 'Test-Seguridad'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});