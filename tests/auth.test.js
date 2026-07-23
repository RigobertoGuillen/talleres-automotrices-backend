const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    try {
      await pool.query("DELETE FROM historial_estados_orden");
      await pool.query("DELETE FROM usuarios WHERE nombre_usuario = 'admin'");

      const contrasenaHash = await bcrypt.hash('admin123', 10);

      await pool.query(`
        INSERT INTO roles (nombre, descripcion) 
        VALUES ('administrador', 'Acceso total al sistema')
        ON CONFLICT (nombre) DO NOTHING;
      `);

      await pool.query(`
        INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
        VALUES ('Administrador', 'admin', 'admin@sigta.com', $1, 
                (SELECT id FROM roles WHERE nombre = 'administrador'), true)
        ON CONFLICT (nombre_usuario) DO NOTHING;
      `, [contrasenaHash]);

      console.log('✅ Usuario admin creado en auth.test.js');

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