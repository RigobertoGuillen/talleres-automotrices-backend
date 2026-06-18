const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Auth Endpoints', () => {

  beforeAll(async () => {
    try {
      await pool.query("DELETE FROM usuarios WHERE nombre_usuario = 'admin'");
      
      await pool.query(`
        INSERT INTO roles (id, nombre, descripcion) 
        OVERRIDING SYSTEM VALUE
        VALUES (1, 'administrador', 'Acceso total al sistema')
        ON CONFLICT (id) DO NOTHING;
      `);

      // Hash real generado con salt de 10 vueltas para 'admin123'
      await pool.query(`
        INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
        VALUES (
          'Administrador Principal', 
          'admin', 
          'admin@sigta.com', 
          '$2b$10$L7Ym8vU0ZdfM597vFm7vO.N1jGv8yYv8u6rP6t8yXW3Z2u1r2u3v.', 
          1
        )
        ON CONFLICT (nombre_usuario) DO NOTHING;
      `);
      console.log('Semilla de ADMIN configurada en Auth');
    } catch (err) {
      console.error('Error en setup de Auth:', err);
    }
  });

  afterAll(async () => {
    // Cerramos la conexión para que Jest termine limpiamente
    await pool.end();
  });

  test('POST /api/auth/login - debería devolver 200 y token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('usuario');
    expect(response.body.usuario).toHaveProperty('rol', 'administrador');
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