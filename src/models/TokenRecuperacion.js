const db = require('../config/db');
const QUERIES = require('../constants/queries/tokenRecuperacionQueries');

class TokenRecuperacion {
  static async create(email, token, expiresAt) {
    const result = await db.query(QUERIES.CREATE, [email, token, expiresAt]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const result = await db.query(QUERIES.FIND_BY_TOKEN, [token]);
    return result.rows[0] || null;
  }

  static async markAsUsed(token) {
    const result = await db.query(QUERIES.MARK_AS_USED, [token]);
    return result.rows[0] || null;
  }

  static async deleteByEmail(email) {
    const result = await db.query(QUERIES.DELETE_BY_EMAIL, [email]);
    return result.rows[0] || null;
  }
}

module.exports = TokenRecuperacion;