const app = require('./app');
const setupDatabase = require('./config/setupDatabase'); // Tu nuevo archivo
const PORT = process.env.PORT || 3000;

// Función para iniciar todo
const startServer = async () => {
  try {
    // 1. Intentamos crear las tablas
    await setupDatabase();
    
    // 2. Solo si lo anterior no falla (o si ya existían), levantamos el servidor
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
      });
    }
  } catch (error) {
    console.error("No se pudo iniciar el servidor debido a un error de base de datos:", error);
  }
};

startServer();