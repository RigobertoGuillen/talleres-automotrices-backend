module.exports = {
  CREATE: `
    INSERT INTO tokens_recuperacion_password (usuario_id, token_hash, fecha_expiracion) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `,

  FIND_BY_TOKEN: `
    SELECT * FROM tokens_recuperacion_password 
    WHERE token_hash = $1 AND fecha_expiracion > NOW() AND usado = false
  `,

  MARK_AS_USED: `
    UPDATE tokens_recuperacion_password 
    SET usado = true, fecha_expiracion = NOW() - INTERVAL '1 minute' 
    WHERE token_hash = $1 
    RETURNING *
  `,

  DELETE_BY_USER: `
    DELETE FROM tokens_recuperacion_password WHERE usuario_id = $1 
    RETURNING *
  `
};