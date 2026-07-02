const request = require('supertest');
const app = require('../src/app');

describe('Clientes Endpoints', () => {
  let token;
  let clienteId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });
    token = response.body.token;
  });

  test('POST /api/clientes - debería crear un cliente', async () => {
    const dniUnico = '9876543210987';
    const correoUnico = `juan_${Date.now()}@mail.com`;

    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dni: dniUnico,
        primer_nombre: 'Juan',
        segundo_nombre: 'Carlos',
        primer_apellido: 'Pérez',
        segundo_apellido: 'Gómez',
        telefono: '9999-9999',
        correo: correoUnico,
        direccion: {
          calle: 'Calle Principal',
          colonia: 'Colonia Centro',
          ciudad: 'Tegucigalpa',
          departamento: 'Francisco Morazán',
          referencia: 'Cerca del parque'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    clienteId = response.body.data.id;
  });

  test('GET /api/clientes - debería listar clientes', async () => {
    const response = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/clientes/dni/:dni - debería buscar por DNI', async () => {
    const response = await request(app)
      .get(`/api/clientes/dni/9876543210987`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('dni', '9876543210987');
  });

  test('PUT /api/clientes/:id - debería editar un cliente', async () => {
    const response = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        telefono: '8888-8888',
        correo: `juan_edit_${Date.now()}@mail.com`
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('telefono', '8888-8888');
  });

  test('DELETE /api/clientes/:id - debería eliminar un cliente', async () => {
    const response = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  test('GET /api/clientes/:id - debería devolver 404 después de eliminar', async () => {
    const response = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
  });
});