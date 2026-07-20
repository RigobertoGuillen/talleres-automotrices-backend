const BaseRepository = require('./base.repository');
const pool = require('../config/db');
const QUERIES = require('../constants/queries/tokenRecuperacionQueries');

class TokenRepository extends BaseRepository {
  constructor() {
    super(pool);
    this.queries = QUERIES;
  }

  async create(usuario_id, token_hash, expiresAt) {
    const result = await this.query(this.queries.CREATE, [usuario_id, token_hash, expiresAt]);
    return result.rows[0] || null;
  }

  async findByToken(token_hash) {
    const result = await this.query(this.queries.FIND_BY_TOKEN, [token_hash]);
    return result.rows[0] || null;
  }

  async findAllActive() {
    const sql = `
      SELECT * FROM tokens_recuperacion_password 
      WHERE fecha_expiracion > NOW() AND usado = false
      ORDER BY fecha_creacion DESC
    `;
    const result = await this.query(sql);
    return result.rows;
  }

  async markAsUsed(token_hash) {
    const result = await this.query(this.queries.MARK_AS_USED, [token_hash]);
    return result.rows[0] || null;
  }

  async deleteByUser(usuario_id) {
    const result = await this.query(this.queries.DELETE_BY_USER, [usuario_id]);
    return result.rows[0] || null;
  }
}

module.exports = new TokenRepository();