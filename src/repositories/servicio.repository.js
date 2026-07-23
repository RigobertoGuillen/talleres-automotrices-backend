const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/servicioQueries');

// SRP: esta clase solo sabe hablar con la base de datos del catálogo de
// servicios; no valida reglas de negocio ni arma respuestas HTTP, eso vive
// en ServicioService/controller.
// OCP/LSP: extiende BaseRepository sin modificarlo y puede usarse en
// cualquier lugar donde se espere un BaseRepository (findAll/findOne/execute).
class ServicioRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async servicioFindAll() {
    return this.findAll(this.queries.SERVICIO_FIND_ALL);
  }

  async servicioFindById(id) {
    return this.findOne(this.queries.SERVICIO_FIND_BY_ID, [id]);
  }

  async servicioFindByNombre(nombre) {
    return this.findOne(this.queries.SERVICIO_FIND_BY_NOMBRE, [nombre]);
  }

  async servicioCreate(data) {
    return this.execute(this.queries.SERVICIO_CREATE, [
      data.nombre, data.descripcion || null, data.precio_base
    ]);
  }

  async servicioUpdate(id, data) {
    return this.execute(this.queries.SERVICIO_UPDATE, [
      data.nombre, data.descripcion || null, data.precio_base, id
    ]);
  }

  async servicioDelete(id) {
    return this.execute(this.queries.SERVICIO_DELETE, [id]);
  }

  async servicioCheckEnUso(id) {
    const result = await this.findOne(this.queries.SERVICIO_CHECK_EN_USO, [id]);
    return parseInt(result?.count || 0) > 0;
  }
}

module.exports = new ServicioRepository();
