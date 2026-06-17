const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
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