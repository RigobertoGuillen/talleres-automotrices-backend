const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    try {
      console.log(' Usuario admin ya existe para pruebas');
    } catch (err) {
      console.error('Error en setup auth:', err);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  test('POST /api/auth/login - debería devolver 200 y token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    if (response.status !== 200) {
      console.log('DEBUG LOGIN FAILED:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/login - debería devolver 401 con contraseña incorrecta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin1234'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/auth/login - debería devolver 401 con usuario inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'usuario_inexistente',
        contrasena: 'admin123'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('POST /api/auth/login - debería devolver 400 sin datos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});