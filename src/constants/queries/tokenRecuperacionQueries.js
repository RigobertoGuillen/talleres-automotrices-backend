module.exports = {
  CREATE: `
    INSERT INTO tokens_recuperacion (email, token, expires_at) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `,

  FIND_BY_TOKEN: `
    SELECT * FROM tokens_recuperacion 
    WHERE token = $1 AND expires_at > NOW() AND used = false
  `,

  MARK_AS_USED: `
    UPDATE tokens_recuperacion 
    SET used = true, expires_at = NOW() - INTERVAL '1 minute' 
    WHERE token = $1 
    RETURNING *
  `,

  DELETE_BY_EMAIL: `
    DELETE FROM tokens_recuperacion WHERE email = $1 
    RETURNING *
  `,
};