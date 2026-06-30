// tests/setup.js
const setupDatabase = require('../src/config/setupDatabase'); // Ajusta la ruta si tu script está en otra carpeta
const pool = require('../src/config/db');

module.exports = async () => {
  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');
  await setupDatabase();
  // Cerramos la conexión del setup para que Jest no deje hilos abiertos de forma global
  await pool.end(); 
};