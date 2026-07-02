const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../src/config/jwt');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id-12345' })
  })
}));

describe('Recuperacion de Contraseña', () => {
  let testEmail = 'admin_recuperar@sigta.com'; // Email único para este test suite
  const JWT_SECRET = process.env.JWT_SECRET || 'talleres_automotrices';

  beforeAll(async () => {
    try {
      // Limpiamos residuos previos por si acaso
      await pool.query('DELETE FROM usuarios WHERE correo = $1 OR nombre_usuario = $2', [testEmail, 'admin_test_rec']);

      await pool.query(
        `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id) 
         VALUES ('Admin Test Rec', 'admin_test_rec', $1, '$2b$10$XQ8sZ9XQ8sZ9XQ8sZ9XQ8uXQ8sZ9XQ8sZ9XQ8sZ9', 1)`,
        [testEmail]
      );
    } catch (error) {
      console.error('Error en beforeAll:', error.message);
    }
  }, 10000);

  // ÚNICO afterAll del archivo: limpia datos y cierra el pool UNA sola vez
  afterAll(async () => {
    try {
      await pool.query('DELETE FROM tokens_recuperacion WHERE email = $1', [testEmail]);
      await pool.query('DELETE FROM usuarios WHERE correo = $1', [testEmail]);
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end(); // Evita Open Handles de Jest (se llama una sola vez)
    }
  }, 10000);

  test('POST /api/auth/recuperar - debería enviar enlace de recuperación', async () => {
    const response = await request(app)
      .post('/api/auth/recuperar')
      .send({ email: testEmail });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  }, 10000);

  test('POST /api/auth/recuperar - debería fallar con email inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/recuperar')
      .send({ email: 'noexiste@mail.com' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/recuperar - debería fallar sin email', async () => {
    const response = await request(app)
      .post('/api/auth/recuperar')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/restablecer - debería restablecer contraseña con token válido', async () => {
    const payload = { email: testEmail, id: 999 };
    const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Insertamos en la tabla respetando únicamente las columnas existentes reales
    await pool.query(
      `INSERT INTO tokens_recuperacion (email, token, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [testEmail, validToken]
    );

    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({
        token: validToken,
        nueva_contrasena: 'admin456'
      });

    // Validamos la respuesta del controlador
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  }, 10000);

  test('POST /api/auth/restablecer - debería fallar con token inválido', async () => {
    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({
        token: 'token_invalido',
        nueva_contrasena: 'admin456'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/restablecer - debería fallar sin token', async () => {
    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({ nueva_contrasena: 'admin456' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/restablecer - debería fallar sin nueva contraseña', async () => {
    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({ token: 'token_valido' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });
});