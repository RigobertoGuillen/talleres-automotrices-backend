const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');

describe('Recuperacion de Contraseña', () => {
  let testEmail = 'admin@sigta.com';
  const JWT_SECRET = process.env.JWT_SECRET || 'talleres_automotrices';

  beforeAll(async () => {
    try {
      await pool.query(
        `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id) 
         VALUES ('Admin Test', 'admin', $1, '$2b$10$XQ8sZ9XQ8sZ9XQ8sZ9XQ8uXQ8sZ9XQ8sZ9XQ8sZ9', 1)
         ON CONFLICT (nombre_usuario) DO NOTHING`,
        [testEmail]
      );
    } catch (error) {
      console.error('Error en beforeAll:', error.message);
    }
  }, 10000);

  afterAll(async () => {
    try {
      await pool.query('DELETE FROM tokens_recuperacion WHERE email = $1', [testEmail]);
    } catch (error) {
      console.error('Error limpiando tokens:', error.message);
    }
  }, 10000);

  test('POST /api/auth/recuperar - debería enviar enlace de recuperación', async () => {
    const response = await request(app)
      .post('/api/auth/recuperar')
      .send({ email: testEmail });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
  }, 10000);

  test('POST /api/auth/recuperar - debería fallar con email inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/recuperar')
      .send({ email: 'noexiste@mail.com' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'No existe un usuario con este email');
  });

  test('POST /api/auth/recuperar - debería fallar sin email', async () => {
    const response = await request(app)
      .post('/api/auth/recuperar')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Email es obligatorio');
  });

  test('POST /api/auth/restablecer - debería restablecer contraseña con token válido', async () => {
    const payload = { email: testEmail, id: 1 };
    const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

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

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Contraseña actualizada correctamente');

    const tokenUsed = await pool.query(
      'SELECT used FROM tokens_recuperacion WHERE token = $1',
      [validToken]
    );
    expect(tokenUsed.rows[0]?.used).toBe(true);

    await pool.query(
      `UPDATE usuarios SET contrasena_hash = '$2b$10$XQ8sZ9XQ8sZ9XQ8sZ9XQ8uXQ8sZ9XQ8sZ9XQ8sZ9' 
       WHERE nombre_usuario = 'admin'`
    );
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
    expect(response.body).toHaveProperty('message', 'Token inválido o expirado');
  });

  test('POST /api/auth/restablecer - debería fallar sin token', async () => {
    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({ nueva_contrasena: 'admin456' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Token y nueva contraseña son obligatorios');
  });

  test('POST /api/auth/restablecer - debería fallar sin nueva contraseña', async () => {
    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({ token: 'token_valido' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Token y nueva contraseña son obligatorios');
  });
});