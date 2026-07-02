const pool = require('../config/db');

class TokenRecuperacion {
  static async create(email, token, expiresAt) {
    const result = await pool.query(
      `INSERT INTO tokens_recuperacion (email, token, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [email, token, expiresAt]
    );
    return result.rows[0];
  }

 static async findByToken(token) {
  const result = await pool.query(
    `SELECT * FROM tokens_recuperacion 
     WHERE token = $1 AND expires_at > NOW()`, 
    [token]
  );
  return result.rows[0] || null;
}

static async markAsUsed(token) {
  // Como no hay columna 'used', forzamos la expiración del token restándole tiempo
  const result = await pool.query(
    `UPDATE tokens_recuperacion 
     SET expires_at = NOW() - INTERVAL '1 minute' 
     WHERE token = $1 
     RETURNING *`,
    [token]
  );
  return result.rows[0] || null;
}

  static async deleteByEmail(email) {
    const result = await pool.query(
      `DELETE FROM tokens_recuperacion WHERE email = $1 RETURNING *`,
      [email]
    );
    return result.rows[0] || null;
  }
}

module.exports = TokenRecuperacion;