const { Pool } = require('pg');

const pool = new Pool({
<<<<<<< HEAD
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin123',
  database: 'taller_mecanico',
=======
  // Si existe la variable de entorno (Docker), la usa. Si no, usa 'localhost'.
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'taller_mecanico',
>>>>>>> 26de220fb97122033ab3b87f93bcaa5b7e92a79e
});

pool.connect()
  .then(() => console.log('Conectado a PostgreSQL exitosamente'))
  .catch(err => console.error('Error al conectar a PostgreSQL:', err));

module.exports = pool;