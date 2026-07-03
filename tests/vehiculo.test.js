const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Vehículos Endpoints', () => {
  let token;
  let clienteId;
  let vehiculoId;

 beforeAll(async () => {
    // 1. Obtenemos el token usando el usuario admin generado por el setup global
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        nombre_usuario: 'admin',
        contrasena: 'admin123'
      });

    token = response.body.token;

    if (!token) {
      throw new Error(
        'No se pudo obtener el token en el setup de vehiculos.test.js: ' +
        JSON.stringify(response.body)
      );
    }

    // 2. Insertamos un cliente dummy en la base de datos para usar su cliente_id 
    // y cumplir la integridad referencial (Foreign Key) sin fallar.
    const clienteRes = await db.query(`
      INSERT INTO clientes (nombre, telefono, correo, direccion) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id
    `, ['Cliente Test Vehiculo', '9999-9999', 'test_cliente_vehiculo@sigta.com', 'Tegucigalpa']);
    
    // Como id es bigint, pg lo devuelve como string o número. Lo guardamos directamente:
    clienteId = clienteRes.rows[0].id;
  });

  // --- PRUEBAS DE LECTURA (GET) ---

  test('GET /api/vehiculos - debería devolver lista de vehículos', async () => {
    const response = await request(app)
      .get('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/vehiculos/marcas - debería retornar el listado estático de marcas', async () => {
    const response = await request(app)
      .get('/api/vehiculos/marcas')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0]).toHaveProperty('nombre', 'Toyota');
  });

  // --- PRUEBAS DE CREACIÓN (POST) ---

  test('POST /api/vehiculos - debería registrar un vehículo exitosamente', async () => {
    // Placa dinámica para que jamás colisione en GitHub Actions/CI por UNIQUE constraint
    const placaUnica = `H${Math.floor(1000 + Math.random() * 9000)}`;

    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: placaUnica,
        marca: 'Toyota',
        modelo: '22R',
        anio: 2015,
        color: 'Rojo',
        tipo: 'Pickup', // Tipo de vehículo válido
        cliente_id: clienteId
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('placa', placaUnica);
    
    // Almacenamos el id para usarlo en las pruebas de búsqueda, actualización e historial
    vehiculoId = response.body.data.id;
  });

  test('POST /api/vehiculos - debería devolver 400 si faltan campos obligatorios', async () => {
    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HBA1111',
        marca: 'Honda' // Faltan modelo, anio, tipo, cliente_id
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Todos los campos obligatorios deben enviarse');
  });

  test('POST /api/vehiculos - debería devolver 400 si el año es menor a 1950 o absurdo', async () => {
    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HBA2222',
        marca: 'Honda',
        modelo: 'Civic',
        anio: 1940, // Inválido menor a 1950
        tipo: 'turismo',
        cliente_id: clienteId
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Año inválido');
  });

  test('POST /api/vehiculos - debería devolver 400 si el tipo no es Pickup, turismo o camioneta', async () => {
    const response = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HBA3333',
        marca: 'Yamaha',
        modelo: 'Cruiser',
        anio: 2020,
        tipo: 'Motocicleta', // Tipo inválido basado en tus TIPOS_VALIDOS
        cliente_id: clienteId
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Tipo de vehículo inválido');
  });

  // --- PRUEBAS DE OPERACIONES CON PARAMETROS (GET/:id, PUT, BUSCAR, HISTORIAL) ---

  test('GET /api/vehiculos/:id - debería obtener los datos de un vehículo específico', async () => {
    const response = await request(app)
      .get(`/api/vehiculos/${vehiculoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(vehiculoId);
  });

  test('GET /api/vehiculos/buscar - debería filtrar vehículos por coincidencia de query', async () => {
    const response = await request(app)
      .get('/api/vehiculos/buscar')
      .query({ q: '22R' }) // Busca por el modelo que insertamos previamente
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('PUT /api/vehiculos/:id - debería actualizar datos del vehículo', async () => {
    const response = await request(app)
      .put(`/api/vehiculos/${vehiculoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        placa: 'HCHANGED',
        marca: 'Toyota',
        modelo: '22R Modified',
        anio: 2016,
        color: 'Azul',
        tipo: 'Pickup',
        cliente_id: clienteId
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.color).toBe('Azul');
    expect(response.body.data.modelo).toBe('22R Modified');
  });

  test('GET /api/vehiculos/:id/historial - debería traer el historial de órdenes de trabajo (vacío o con datos)', async () => {
    const response = await request(app)
      .get(`/api/vehiculos/${vehiculoId}/historial`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/vehiculos/:id - debería devolver 404 si el vehículo no existe', async () => {
    const idInexistente = 999999;
    const response = await request(app)
      .get(`/api/vehiculos/${idInexistente}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  // --- LIMPIEZA DE ENTORNO ---

  afterAll(async () => {
    if (clienteId) {
      // Al borrar el cliente, si tienes ON DELETE CASCADE se lleva los vehículos vinculados.
      // Por seguridad, limpiamos explícitamente el vehículo creado en este entorno aislado primero.
      await db.query('DELETE FROM vehiculos WHERE cliente_id = $1', [clienteId]);
      await db.query('DELETE FROM clientes WHERE id = $1', [clienteId]);
    }
    
    // Cerramos la conexión para que Jest no se quede colgado
    await db.end();
  });
});