// tests/setup.js
const setupDatabase = require('../src/config/setupDatabase');
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs'); // Asegúrate de tenerlo o usa el módulo que uses para hash

module.exports = async () => {
  // 1. Forzar variables de entorno por defecto para GitHub Actions / CI
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_para_entorno_de_pruebas_123';
  process.env.NODE_ENV = 'test';

  console.log('\n--- Inicializando Base de Datos para Entorno de Pruebas ---');
  
  // 2. Ejecutar la migración de las tablas e inserción de datos iniciales
  await setupDatabase();
  
  // 3. Asegurar que el usuario 'admin' de los tests exista con 'admin123'
  try {
    // Si tu sistema usa contraseñas encriptadas con bcrypt:
    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash('admin123', salt);

    // Limpiamos si ya existe para evitar conflictos de llaves únicas
    await pool.query('DELETE FROM usuarios WHERE nombre_usuario = $1 OR correo = $2', ['admin', 'admin@taller.com']);

    // Insertamos el admin con la estructura exacta que pide tu tabla usuarios
    await pool.query(
      `INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol) 
       VALUES ($1, $2, $3, $4)`,
      ['admin', 'admin@taller.com', hashContrasena, 'admin']
    );
    console.log('✔ Usuario administrador de pruebas sincronizado con éxito.');
  } catch (err) {
    console.error('⚠ Nota al crear admin de pruebas:', err.message);
  }

  console.log('--- Base de Datos Inicializada Correctamente ---\n');
};