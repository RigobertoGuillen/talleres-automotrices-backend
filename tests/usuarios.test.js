const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db'); // 👈 Importamos el pool para sembrar los datos preventivos

describe('Usuarios Endpoints', () => {
  let token;

  beforeAll(async () => {
    // 1. Insertamos el rol omitiendo el campo 'id' para evitar choques con secuencias automáticas
    await pool.query(`
      INSERT INTO roles (nombre, descripcion) VALUES
      ('administrador', 'Acceso total al sistema') 
      ON CONFLICT (nombre) DO NOTHING;
    `);

    // 2. Insertamos al administrador buscando dinámicamente el ID generado para el rol 'administrador'
    await pool.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id)
      VALUES (
        'Administrador Principal', 
        'admin', 
        'admin@sigta.com', 
        '$2b$10$L7Ym8vU0ZdfM597vFm7vO.N1jGv8yYv8u6rP6t8yXW3Z2u1r2u3v.', 
        (SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1)
      )
      ON CONFLICT (nombre_usuario) DO NOTHING;
    `);

    // 3. Ahora sí hacemos el login de forma segura
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });
    token = response.body.token;
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
    // Generamos un identificador único con el milisegundo actual
    const usuarioUnico = `juan_${Date.now()}`;

    const response = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_completo: 'Juan Pérez',
        nombre_usuario: usuarioUnico, 
        correo: `juan_${Date.now()}@sigta.com`, 
        contrasena: 'juan123',
        rol_id: 2
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
});