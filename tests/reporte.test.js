const request = require('supertest');
const app = require('../src/app');

describe('Módulo de Reportes', () => {
  let token;
  let tokenRecepcionista;

  const HOY = new Date().toISOString().slice(0, 10);
  const HACE_90_DIAS = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ nombre_usuario: 'admin', contrasena: 'admin123' });
    token = response.body.token;

    if (!token) {
      throw new Error('No se pudo obtener el token de administrador: ' + JSON.stringify(response.body));
    }

    const loginRecep = await request(app)
      .post('/api/auth/login')
      .send({ nombre_usuario: 'alopez', contrasena: 'alopez123' });
    tokenRecepcionista = loginRecep.body.token;
  });

  describe('HU-39: Reporte de servicios realizados', () => {
    test('GET /api/reportes/servicios - debería generar el reporte filtrando por fecha', async () => {
      const response = await request(app)
        .get(`/api/reportes/servicios?fecha_inicio=${HACE_90_DIAS}&fecha_fin=${HOY}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('detalle');
      expect(response.body.data).toHaveProperty('resumen');
      expect(response.body.data).toHaveProperty('cantidad_total');
    });

    test('GET /api/reportes/servicios - debería fallar sin fechas', async () => {
      const response = await request(app)
        .get('/api/reportes/servicios')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('HU-40: Reporte de vehículos atendidos', () => {
    test('GET /api/reportes/vehiculos-atendidos - debería clasificar por tipo', async () => {
      const response = await request(app)
        .get(`/api/reportes/vehiculos-atendidos?fecha_inicio=${HACE_90_DIAS}&fecha_fin=${HOY}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('por_tipo');
      expect(response.body.data).toHaveProperty('periodo');
      expect(Array.isArray(response.body.data.por_tipo)).toBe(true);
    });
  });

  describe('HU-41: Reporte de inventario utilizado', () => {
    test('GET /api/reportes/inventario-utilizado - debería listar consumo por repuesto', async () => {
      const response = await request(app)
        .get(`/api/reportes/inventario-utilizado?fecha_inicio=${HACE_90_DIAS}&fecha_fin=${HOY}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.resumen)).toBe(true);
    });
  });

  describe('HU-42: Reporte de ingresos', () => {
    test('GET /api/reportes/ingresos - debería mostrar totales por período', async () => {
      const response = await request(app)
        .get(`/api/reportes/ingresos?fecha_inicio=${HACE_90_DIAS}&fecha_fin=${HOY}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totales');
      expect(response.body.data).toHaveProperty('por_dia');
    });
  });

  describe('HU-43: Reporte por mecánico', () => {
    test('GET /api/reportes/mecanicos/activos - debería listar mecánicos', async () => {
      const response = await request(app)
        .get('/api/reportes/mecanicos/activos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/reportes/mecanicos - debería mostrar órdenes y servicios por mecánico', async () => {
      const response = await request(app)
        .get(`/api/reportes/mecanicos?fecha_inicio=${HACE_90_DIAS}&fecha_fin=${HOY}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('ordenes_completadas');
        expect(response.body.data[0]).toHaveProperty('servicios_realizados');
      }
    });
  });

  describe('HU-44: Reporte de órdenes pendientes', () => {
    test('GET /api/reportes/ordenes-pendientes - debería listar solo órdenes no entregadas', async () => {
      const response = await request(app)
        .get('/api/reportes/ordenes-pendientes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(o => o.estado !== 'entregado')).toBe(true);
    });

    test('GET /api/reportes/ordenes-pendientes?antiguedad_minima= - debería filtrar por antigüedad', async () => {
      const response = await request(app)
        .get('/api/reportes/ordenes-pendientes?antiguedad_minima=9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('HU-45: Dashboard general', () => {
    test('GET /api/reportes/dashboard - debería devolver los indicadores principales', async () => {
      const response = await request(app)
        .get('/api/reportes/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ordenesProgreso');
      expect(response.body).toHaveProperty('ordenesActivas');
      expect(response.body).toHaveProperty('vehiculosListos');
      expect(response.body).toHaveProperty('diagnosticosPendientes');
      expect(response.body).toHaveProperty('alertasInventario');
      expect(response.body).toHaveProperty('totalClientes');
      expect(response.body).toHaveProperty('ingresosMes');
    });

    test('GET /api/dashboard/stats - alias de compatibilidad debería responder igual', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ordenesProgreso');
    });
  });

  describe('Seguridad', () => {
    test('GET /api/reportes/servicios - debería devolver 401 sin token', async () => {
      const response = await request(app).get('/api/reportes/servicios');
      expect(response.status).toBe(401);
    });

    test('GET /api/reportes/servicios - debería devolver 403 si no es administrador', async () => {
      if (!tokenRecepcionista) return;
      const response = await request(app)
        .get(`/api/reportes/servicios?fecha_inicio=${HACE_90_DIAS}&fecha_fin=${HOY}`)
        .set('Authorization', `Bearer ${tokenRecepcionista}`);

      expect(response.status).toBe(403);
    });

    test('GET /api/reportes/dashboard - recepcionista sí puede consultarlo', async () => {
      if (!tokenRecepcionista) return;
      const response = await request(app)
        .get('/api/reportes/dashboard')
        .set('Authorization', `Bearer ${tokenRecepcionista}`);

      expect(response.status).toBe(200);
    });
  });
});
