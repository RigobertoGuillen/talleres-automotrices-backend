const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || process.env.DB_NAME || 'taller_db_f0r4',
});

module.exports = {
  // Ejecuta consultas usando el pool
  query: (text, params) => pool.query(text, params),
  // Cierra todas las conexiones (vital para que Jest termine bien)
  end: () => pool.end(),
};