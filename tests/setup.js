// tests/setup.js
const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

module.exports = async () => {
  // 1. Forzar variables de entorno por defecto para GitHub Actions / CI
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');
  
  // 2. Ejecutar la migración de las tablas e inserción de datos iniciales
  await setupDatabase();
  
  // 3. Asegurar que el usuario 'admin' de los tests exista con 'admin123'
  try {
    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash('admin123', salt);

    // Limpiamos si ya existe por nombre de usuario para evitar duplicados
    await pool.query('DELETE FROM usuarios WHERE nombre_usuario = $1', ['admin']);

    // Insertamos usando el nombre de columna real: contrasena_hash
    await pool.query(
      `INSERT INTO usuarios (nombre_usuario, correo, contrasena_hash, rol) 
       VALUES ($1, $2, $3, $4)`,
      ['admin', 'admin@taller.com', hashContrasena, 'admin']
    );
    console.log('✔ Usuario administrador de pruebas sincronizado con éxito.');
  } catch (err) {
    console.error('⚠ Error al crear admin de pruebas:', err.message);
  }

  console.log('--- Base de Datos Inicializada Correctamente ---\n');
};