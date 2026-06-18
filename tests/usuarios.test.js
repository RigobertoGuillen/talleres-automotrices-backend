const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db'); // Usar db

describe('Usuarios Endpoints', () => {
  let token;

  beforeAll(async () => {
    try {
      const bcrypt = require('bcryptjs'); // Asegúrate de tenerlo importado
      const contrasenaHash = await bcrypt.hash('admin123', 10); // Genera hash dinámico

      await db.query("DELETE FROM usuarios WHERE nombre_usuario = 'admin'");
      
      await db.query(`
        INSERT INTO roles (id, nombre, descripcion) 
        OVERRIDING SYSTEM VALUE
        VALUES (1, 'administrador', 'Acceso total al sistema')
        ON CONFLICT (id) DO NOTHING;
      `);

      await db.query(`
        INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
        VALUES ('Administrador Principal', 'admin', 'admin@sigta.com', $1, 1)
        ON CONFLICT (nombre_usuario) DO NOTHING;
      `, [contrasenaHash]); // Usamos el hash generado

      // Ahora el login debería funcionar y devolver un token real
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          nombre_usuario: 'admin',
          contrasena: 'admin123'
        });
      
      token = response.body.token;
      
      // Opcional: Verifica que realmente recibiste un token
      if (!token) {
        throw new Error('No se pudo obtener el token en el setup');
      }
    } catch (err) {
      console.error('Error en setup usuarios:', err);
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