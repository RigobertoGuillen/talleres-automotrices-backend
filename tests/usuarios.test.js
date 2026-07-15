const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const JWT_SECRET = require('../src/config/jwt');

describe('Usuarios Endpoints', () => {
  let token;

  beforeAll(async () => {
    // Limpiamos residuos de ejecuciones anteriores
    await db.query("DELETE FROM usuarios WHERE nombre_usuario = 'juan'");

    // El usuario admin ya lo crea el globalSetup (ver tests/setup.js),
    // así que solo necesitamos loguearnos una vez. No borramos ni
    // recreamos el admin aquí: eso invalidaba el token (el id cambiaba
    // al reinsertar el usuario) y provocaba 401 en cascada.
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error(
        'No se pudo obtener el token en el setup de usuarios.test.js: ' +
        JSON.stringify(response.body)
      );
    }
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
    const usuarioUnico = `juan_${Date.now()}`;

    const response = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_completo: 'Juan Pérez',
        nombre_usuario: usuarioUnico,
        correo: `juan_${Date.now()}@sigta.com`,
        contrasena: 'juan123',
        rol_id: 1
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('nombre_usuario', usuarioUnico);
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

  afterAll(async () => {
    await db.end();
  });
});