const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Clientes Endpoints', () => {

  let token;
  let clienteId;
  const dniUnico = '9876543210987';

  beforeAll(async () => {

    // Limpiamos por dni (no por correo): el dni es fijo entre corridas,
    // así que hay que borrarlo antes de crear el cliente o chocará con
    // la restricción UNIQUE de la columna dni.
    await pool.query(
      `DELETE FROM clientes WHERE dni = $1`,
      [dniUnico]
    );

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error(
        'No se pudo obtener el token: ' +
        JSON.stringify(response.body)
      );
    }

  });

  afterAll(async () => {
    await pool.end();
  });

  test('POST /api/clientes - debería crear un cliente', async () => {
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
    expect(response.body.data).toHaveProperty('dni', dniUnico);
    clienteId = response.body.data.id;

  });

  test('GET /api/clientes - deberia listar clientes', async () => {

    const response = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);

  });

  test('GET /api/clientes/buscar - deberia buscar por nombre', async () => {

    const response = await request(app)
      .get('/api/clientes/buscar?q=Juan')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);

  });

  test('GET /api/clientes/dni/:dni - deberia buscar por DNI', async () => {

    const response = await request(app)
      .get(`/api/clientes/dni/${dniUnico}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('dni', dniUnico);

  });

  test('GET /api/clientes/:id - deberia obtener un cliente', async () => {

    const response = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(clienteId);

  });

  test('PUT /api/clientes/:id - deberia editar un cliente', async () => {

    const response = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        telefono: '8888-8888',
        correo: `juan_edit_${Date.now()}@mail.com`
      });

    expect(response.status).toBe(200);
    expect(response.body.data.telefono).toBe('8888-8888');

  });

  test('GET /api/clientes/:id/historial - deberia obtener historial', async () => {

    const response = await request(app)
      .get(`/api/clientes/${clienteId}/historial`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('cliente');
    expect(response.body.data).toHaveProperty('historial');

  });

  test('DELETE /api/clientes/:id - deberia eliminar un cliente', async () => {

    const response = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

  });

  test('GET /api/clientes/:id - deberia devolver 404 despues de eliminar', async () => {

    const response = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);

  });

});