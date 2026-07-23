const pool = require('../config/db');

class BaseRepository {
  constructor(db = pool) {
    this.db = db;
  }

  async query(sql, params = []) {
    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      throw new Error(`Error en base de datos: ${error.message}`);
    }
  }

  async findOne(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }

  async findAll(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows;
  }

  async execute(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows[0] || null;
  }
}

module.exports = BaseRepository;