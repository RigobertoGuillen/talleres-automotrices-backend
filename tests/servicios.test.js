const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Módulo de Catálogo de Servicios', () => {
  let token;
  let servicioId;

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

    await pool.query("DELETE FROM orden_servicio WHERE servicio_id IN (SELECT id FROM servicio_catalogo WHERE nombre LIKE 'Test-%')");
    await pool.query("DELETE FROM servicio_catalogo WHERE nombre LIKE 'Test-%'");
  });

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM orden_servicio WHERE servicio_id IN (SELECT id FROM servicio_catalogo WHERE nombre LIKE 'Test-%')");
      await pool.query("DELETE FROM servicio_catalogo WHERE nombre LIKE 'Test-%'");
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end();
    }
  });

  test('POST /api/servicios - debería crear un servicio', async () => {
    const response = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test-Cambio de bateria',
        descripcion: 'Cambio e instalación de batería nueva',
        precio_base: 300
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.nombre).toBe('Test-Cambio de bateria');

    servicioId = response.body.data.id;
  });

  test('POST /api/servicios - debería fallar sin nombre', async () => {
    const response = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send({ precio_base: 100 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('obligatorio');
  });

  test('POST /api/servicios - debería fallar con nombre duplicado', async () => {
    const response = await request(app)
      .post('/api/servicios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Test-Cambio de bateria', precio_base: 100 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('existe');
  });

  test('GET /api/servicios - debería listar servicios', async () => {
    const response = await request(app)
      .get('/api/servicios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/servicios/:id - debería obtener un servicio por ID', async () => {
    const response = await request(app)
      .get(`/api/servicios/${servicioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(servicioId);
  });

  test('PUT /api/servicios/:id - debería actualizar un servicio', async () => {
    const response = await request(app)
      .put(`/api/servicios/${servicioId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test-Cambio de bateria',
        descripcion: 'Cambio de batería (actualizado)',
        precio_base: 320
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(parseFloat(response.body.data.precio_base)).toBe(320);
  });

  test('DELETE /api/servicios/:id - debería eliminar el servicio', async () => {
    const response = await request(app)
      .delete(`/api/servicios/${servicioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  describe('Servicios aplicados a una orden (orden_servicio)', () => {
    let servicioOrdenId;
    let ordenServicioId;

    beforeAll(async () => {
      const creado = await request(app)
        .post('/api/servicios')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Test-OrdenServicio-Aceite', precio_base: 450 });
      servicioOrdenId = creado.body.data.id;
    });

    test('POST /api/servicios/orden - debería registrar un servicio en una orden', async () => {
      const response = await request(app)
        .post('/api/servicios/orden')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orden_id: 'ORD-1',
          servicio_id: servicioOrdenId,
          tiempo_empleado_minutos: 30,
          observaciones: 'Cambio de aceite de rutina (prueba)'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orden_id).toBe('ORD-1');
      expect(parseFloat(response.body.data.precio_aplicado)).toBe(450);

      ordenServicioId = response.body.data.id;
    });

    test('POST /api/servicios/orden - debería fallar con una orden inexistente', async () => {
      const response = await request(app)
        .post('/api/servicios/orden')
        .set('Authorization', `Bearer ${token}`)
        .send({ orden_id: 'ORD-NO-EXISTE', servicio_id: servicioOrdenId });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no encontrada');
    });

    test('GET /api/servicios/orden/:ordenId - debería listar los servicios de la orden', async () => {
      const response = await request(app)
        .get('/api/servicios/orden/ORD-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.some(s => s.id === ordenServicioId)).toBe(true);
    });

    test('DELETE /api/servicios/:id - no debería poder eliminar el servicio mientras esté aplicado', async () => {
      const response = await request(app)
        .delete(`/api/servicios/${servicioOrdenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('aplicado');
    });

    test('DELETE /api/servicios/orden/:id - debería remover el servicio de la orden', async () => {
      const response = await request(app)
        .delete(`/api/servicios/orden/${ordenServicioId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/servicios/orden - debería devolver 403 si es recepcionista', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ nombre_usuario: 'alopez', contrasena: 'alopez123' });

      if (loginResponse.status !== 200) {
        console.log('Login de alopez falló:', loginResponse.body);
        return;
      }

      const userToken = loginResponse.body.token;

      const response = await request(app)
        .post('/api/servicios/orden')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orden_id: 'ORD-1', servicio_id: servicioOrdenId });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Seguridad', () => {
    test('GET /api/servicios - debería devolver 401 sin token', async () => {
      const response = await request(app)
        .get('/api/servicios');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/servicios - un usuario no administrador SÍ puede ver el catálogo', async () => {
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
        .get('/api/servicios')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/servicios - debería devolver 403 si no es administrador', async () => {
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
        .post('/api/servicios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: 'Test-Seguridad',
          precio_base: 100
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('DELETE /api/servicios/:id - debería devolver 403 si no es administrador', async () => {
      const creado = await request(app)
        .post('/api/servicios')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Test-Seguridad-Delete', precio_base: 100 });

      const idParaProbar = creado.body.data.id;

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
        .delete(`/api/servicios/${idParaProbar}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
