const request = require('supertest');
const app = require('../src/app');

describe('Módulo de Reportes y Dashboard', () => {
  let token;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error('No se pudo obtener el token');
    }
  });

  describe('HU-39: Reporte de servicios realizados', () => {
    test('GET /api/reportes/servicios - debería obtener reporte de servicios', async () => {
      const response = await request(app)
        .get('/api/reportes/servicios')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total_servicios');
      expect(response.body.meta).toHaveProperty('total_ingresos');
    });

    test('GET /api/reportes/servicios - debería filtrar por fechas', async () => {
      const response = await request(app)
        .get('/api/reportes/servicios?fecha_inicio=2026-01-01&fecha_fin=2026-12-31')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('HU-40: Reporte de vehículos atendidos', () => {
    test('GET /api/reportes/vehiculos - debería obtener reporte de vehículos', async () => {
      const response = await request(app)
        .get('/api/reportes/vehiculos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total_vehiculos');
      expect(response.body.meta).toHaveProperty('por_tipo');
    });
  });

  describe('HU-41: Reporte de inventario utilizado', () => {
    test('GET /api/reportes/repuestos - debería obtener reporte de repuestos utilizados', async () => {
      const response = await request(app)
        .get('/api/reportes/repuestos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total_repuestos');
      expect(response.body.meta).toHaveProperty('total_valor');
    });
  });

  describe('HU-42: Reporte de ingresos generados', () => {
    test('GET /api/reportes/ingresos - debería obtener reporte de ingresos', async () => {
      const response = await request(app)
        .get('/api/reportes/ingresos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total_facturas');
      expect(response.body.meta).toHaveProperty('total_ingresos');
    });
  });

  describe('HU-43: Reporte por mecánico', () => {
    test('GET /api/reportes/mecanicos - debería obtener reporte por mecánico', async () => {
      const response = await request(app)
        .get('/api/reportes/mecanicos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total_mecanicos');
    });
  });

  describe('HU-44: Reporte de órdenes pendientes', () => {
    test('GET /api/reportes/ordenes-pendientes - debería obtener órdenes pendientes', async () => {
      const response = await request(app)
        .get('/api/reportes/ordenes-pendientes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('por_estado');
      expect(response.body.meta).toHaveProperty('antiguedad_promedio');
    });

    test('GET /api/reportes/ordenes-pendientes?estado=recibido - debería filtrar por estado', async () => {
      const response = await request(app)
        .get('/api/reportes/ordenes-pendientes?estado=recibido')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(item => item.estado === 'recibido')).toBe(true);
    });
  });

  describe('HU-45: Dashboard general', () => {
    test('GET /api/reportes/dashboard - debería obtener datos del dashboard', async () => {
      const response = await request(app)
        .get('/api/reportes/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ordenes_activas');
      expect(response.body.data).toHaveProperty('ingresos_hoy');
      expect(response.body.data).toHaveProperty('stock_critico');
      expect(response.body.data).toHaveProperty('diagnosticos_pendientes');
    });
  });

  describe('Seguridad', () => {
    test('GET /api/reportes/dashboard - debería devolver 401 sin token', async () => {
      const response = await request(app)
        .get('/api/reportes/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/reportes/dashboard - debería devolver 403 si no es administrador', async () => {
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
        .get('/api/reportes/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});