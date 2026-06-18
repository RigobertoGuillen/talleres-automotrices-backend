const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db'); // 👈 Importamos el pool para sembrar los datos en la nube

describe('Auth Endpoints', () => {

  beforeAll(async () => {
    try {
      // 1. Limpieza radical preventiva
      await pool.query("DELETE FROM usuarios WHERE nombre_usuario = 'admin'");
      
      // 2. Forzar el ID 1 en roles saltándonos el control del sistema autoincrementable
      await pool.query(`
        INSERT INTO roles (id, nombre, descripcion) 
        VALUES (1, 'administrador', 'Acceso total al sistema')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 3. Insertar el administrador amarrado directamente al rol_id = 1
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
      console.log('Semilla blindada de ADMIN inyectada con éxito');

      // (Solo para usuarios.test.js: mantén el bloque del login aquí abajo)
      if (typeof request !== 'undefined' && typeof app !== 'undefined') {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ nombre_usuario: 'admin', contrasena: 'admin123' });
        token = response.body.token;
      }
    } catch (err) {
      console.error('Error crítico en inyección beforeAll:', err);
    }
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