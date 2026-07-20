const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id-12345' })
  })
}));

describe('Recuperacion de Contraseña', () => {
  let testEmail = 'admin_recuperar@sigta.com';
  let usuarioId;

  beforeAll(async () => {
    try {
      await pool.query('DELETE FROM tokens_recuperacion_password WHERE usuario_id IN (SELECT id FROM usuarios WHERE correo = $1)', [testEmail]);
      await pool.query('DELETE FROM usuarios WHERE correo = $1 OR nombre_usuario = $2', [testEmail, 'admin_test_rec']);

      const result = await pool.query(
        `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo) 
         VALUES ('Admin Test Rec', 'admin_test_rec', $1, '$2b$10$XQ8sZ9XQ8sZ9XQ8sZ9XQ8uXQ8sZ9XQ8sZ9XQ8sZ9', 1, true)
         RETURNING id`,
        [testEmail]
      );
      usuarioId = result.rows[0].id;
    } catch (error) {
      console.error('Error en beforeAll:', error.message);
    }
  }, 10000);

  afterAll(async () => {
    try {
      await pool.query('DELETE FROM tokens_recuperacion_password WHERE usuario_id = $1', [usuarioId]);
      await pool.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
    } catch (error) {
      console.error('Error limpiando datos:', error.message);
    } finally {
      await pool.end();
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
    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 3600000);

    await pool.query(
      `INSERT INTO tokens_recuperacion_password (usuario_id, token_hash, fecha_expiracion) 
       VALUES ($1, $2, $3)`,
      [usuarioId, token_hash, expiresAt]
    );

    const response = await request(app)
      .post('/api/auth/restablecer')
      .send({
        token: token,
        nueva_contrasena: 'admin456'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Contraseña actualizada correctamente');
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