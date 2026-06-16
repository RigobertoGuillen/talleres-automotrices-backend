const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'taller_mecanico',
});

pool.connect()
  .then(() => console.log('Conectado a PostgreSQL exitosamente'))
  .catch(err => console.error('Error al conectar a PostgreSQL:', err));

module.exports = pool;