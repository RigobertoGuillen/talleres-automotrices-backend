// tests/setup.js
const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');

module.exports = async () => {
  // 1. Forzar variables de entorno por defecto para GitHub Actions / CI
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');
  
  // 2. Ejecutar la migración de las tablas e inserción de datos iniciales
  await setupDatabase();
  
  // NO cerramos el pool aquí para que los archivos de test individuales puedan reutilizarlo.
  console.log('--- Base de Datos Inicializada Correctamente ---\n');
};