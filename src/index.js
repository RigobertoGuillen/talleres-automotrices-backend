const app = require('./app');
const PORT = process.env.PORT || 3000;

// Solo iniciamos el servidor si NO estamos en entorno de test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}