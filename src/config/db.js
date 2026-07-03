const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Configuramos SSL si estamos en producción (Render) 
// o si estamos ejecutando los tests contra una base de datos remota.
const sslConfig = (isProduction || isTest) 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};