const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function verificarAdmin() {
  try {
    console.log('Verificando usuario admin...');
    const result = await pool.query(
      `SELECT id, nombre_usuario, correo, activo, rol_id 
       FROM usuarios WHERE nombre_usuario = $1`,
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log(' Usuario admin NO existe. Creando...');
      
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO usuarios (nombre_completo, nombre_usuario, correo, contrasena_hash, rol_id, activo)
         VALUES ($1, $2, $3, $4, 
           (SELECT id FROM roles WHERE nombre = 'administrador'), 
           true)`,
        ['Administrador', 'admin', 'admin@taller.com', hash]
      );
      console.log('Usuario admin creado');
    } else {
      console.log('Usuario admin existe:', result.rows[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error(' Error:', error.message);
    process.exit(1);
  }
}

verificarAdmin();