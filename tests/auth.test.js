const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db'); // Usar db

describe('Auth Endpoints', () => {
  beforeAll(async () => {
  try {
    const contrasenaHash = await bcrypt.hash('admin123', 10);

    await db.query("DELETE FROM historial_estados_orden");
    await db.query("DELETE FROM diagnosticos");
    await db.query("DELETE FROM usuarios WHERE nombre_usuario = 'admin'");
    
    // Añadimos OVERRIDING SYSTEM VALUE
    await db.query(`
      INSERT INTO roles (id, nombre, descripcion) 
      OVERRIDING SYSTEM VALUE
      VALUES (1, 'administrador', 'Acceso total al sistema')
      ON CONFLICT (id) DO NOTHING;
    `);

    await db.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
      VALUES ('Administrador', 'admin', 'admin@sigta.com', $1, 1)
      ON CONFLICT (nombre_usuario) DO NOTHING;
    `, [contrasenaHash]);
    
  } catch (err) {
    console.error('Error en setup auth:', err);
  }
});
  test('POST /api/auth/login - debería devolver 200 y token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });
    
    // Si falla, imprimimos el cuerpo para ver el error real
    if (response.status !== 200) {
      console.log('DEBUG LOGIN FAILED:', response.body);
    }
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
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

  afterAll(async () => {
  await db.end(); // Esto es fundamental para cerrar las conexiones
});
});