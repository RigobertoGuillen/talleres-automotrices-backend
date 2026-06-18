const request = require('supertest');
const app = require('../src/app');

describe('Usuarios Endpoints', () => {
  let token;

  beforeAll(async () => {
    try {
      // 1. Intentamos crear el administrador mediante la API directamente
      await request(app)
        .post('/api/usuarios')
        .send({
          nombre_completo: 'Administrador Principal',
          nombre_usuario: 'admin',
          correo: 'admin@sigta.com',
          contrasena: 'admin123',
          rol_id: 1
        });
    } catch (err) {
      // Ignorar si ya fue creado previamente
    }

    // 2. Realizamos el inicio de sesión para obtener el token de autorización
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
});