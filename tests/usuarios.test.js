const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Usuarios Endpoints', () => {
  let token;
  let usuarioId;

  beforeAll(async () => {
    await pool.query("DELETE FROM usuarios WHERE nombre_usuario LIKE 'test_%'");
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
  });

  afterAll(async () => {
    if (usuarioId) {
      await pool.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
    }
    await pool.end();
  });

  test('GET /api/usuarios - debería devolver lista de usuarios', async () => {
    const response = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/usuarios - debería devolver 401 sin token', async () => {
    const response = await request(app)
      .get('/api/usuarios');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/usuarios - debería crear un usuario', async () => {
    const nombreUnico = `test_${Date.now()}`;

    const response = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_completo: 'Juan Pérez',
        nombre_usuario: nombreUnico,
        correo: `juan_${Date.now()}@sigta.com`,
        contrasena: 'juan123',
        rol_id: 3
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.nombre_usuario).toBe(nombreUnico);

    usuarioId = response.body.data.id;
  });

  test('POST /api/usuarios - debería devolver 400 con datos incompletos', async () => {
    const response = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_completo: 'Juan Pérez'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/usuarios/:id - debería obtener un usuario por ID', async () => {
    const response = await request(app)
      .get(`/api/usuarios/${usuarioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(usuarioId);
  });

  test('PATCH /api/usuarios/:id/estado - debería desactivar un usuario', async () => {
    const response = await request(app)
      .patch(`/api/usuarios/${usuarioId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ activo: false });

    expect(response.status).toBe(200);
    expect(response.body.data.activo).toBe(false);
  });

  test('DELETE /api/usuarios/:id - debería eliminar un usuario', async () => {
    const response = await request(app)
      .delete(`/api/usuarios/${usuarioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});