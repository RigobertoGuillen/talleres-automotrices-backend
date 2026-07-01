const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Clientes Endpoints', () => {
  let token;
  let clienteId;
  const dniPrueba = '1234567890123';

  beforeAll(async () => {
    // Limpiamos residuos de una corrida anterior que haya fallado antes
    // de llegar al DELETE final, para que el POST no choque con un
    // DNI duplicado (unique constraint) y devuelva algo distinto de 201.
    await pool.query('DELETE FROM clientes WHERE dni = $1', [dniPrueba]);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error(
        'No se pudo obtener el token en el setup de clientes.test.js: ' +
        JSON.stringify(response.body)
      );
    }
  });

  // ÚNICO afterAll del archivo
  afterAll(async () => {
    await pool.end(); // Esto cierra los hilos de manera limpia al terminar esta suite
  });

  test('POST /api/clientes - deberia crear un cliente', async () => {
    const response = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dni: dniPrueba,
        primer_nombre: 'Juan',
        segundo_nombre: 'Carlos',
        primer_apellido: 'Perez',
        segundo_apellido: 'Gomez',
        telefono: '9999-9999',
        correo: 'juan@mail.com',
        direccion: 'Calle Principal, Colonia Centro, Tegucigalpa' // Formato plano sincronizado con la base de datos
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('dni', dniPrueba);
    clienteId = response.body.data.id;
  });

  test('GET /api/clientes - deberia listar clientes', async () => {
    const response = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/clientes/dni/:dni - deberia buscar por DNI', async () => {
    const response = await request(app)
      .get(`/api/clientes/dni/${dniPrueba}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('dni', dniPrueba);
  });

  test('GET /api/clientes/buscar?q= - deberia buscar por nombre', async () => {
    const response = await request(app)
      .get('/api/clientes/buscar?q=Juan')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('PUT /api/clientes/:id - deberia editar un cliente', async () => {
    const response = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        telefono: '8888-8888',
        correo: 'juan.nuevo@mail.com'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('telefono', '8888-8888');
  });

  test('GET /api/clientes/:id/historial - deberia obtener historial', async () => {
    const response = await request(app)
      .get(`/api/clientes/${clienteId}/historial`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('cliente');
    expect(response.body.data).toHaveProperty('historial');
  });

  test('DELETE /api/clientes/:id - deberia eliminar un cliente', async () => {
    const response = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  test('GET /api/clientes/:id - deberia devolver 404 despues de eliminar', async () => {
    const response = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
  });
});