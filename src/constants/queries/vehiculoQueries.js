module.exports = {
  FIND_ALL: `
    SELECT v.id, v.placa, m.id AS marca_id, m.nombre AS marca,
           v.modelo, v.anio, v.color, v.tipo, v.cliente_id, v.fecha_registro
    FROM vehiculos v
    JOIN marcas_vehiculo m ON v.marca_id = m.id
    ORDER BY v.id
  `,

  FIND_BY_ID: `
    SELECT v.*, m.nombre AS marca
    FROM vehiculos v
    JOIN marcas_vehiculo m ON v.marca_id = m.id
    WHERE v.id = $1
  `,

  FIND_BY_PLACA: `
    SELECT v.*, m.nombre AS marca
    FROM vehiculos v
    JOIN marcas_vehiculo m ON v.marca_id = m.id
    WHERE v.placa = $1
  `,

  CREATE: `
    INSERT INTO vehiculos (placa, marca_id, modelo, anio, color, tipo, cliente_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,

  UPDATE: `
    UPDATE vehiculos
    SET placa = $1, marca_id = $2, modelo = $3, anio = $4, color = $5, tipo = $6, cliente_id = $7
    WHERE id = $8
    RETURNING *
  `,

  BUSCAR: `
    SELECT v.id, v.placa, m.id AS marca_id, m.nombre AS marca,
           v.modelo, v.anio, v.color, v.tipo, v.cliente_id, v.fecha_registro
    FROM vehiculos v
    JOIN marcas_vehiculo m ON v.marca_id = m.id
    WHERE v.placa ILIKE $1 OR m.nombre ILIKE $1 OR v.modelo ILIKE $1
    ORDER BY v.id
  `,

  FIND_BY_CLIENTE: `
    SELECT
      v.id, v.placa, m.nombre AS marca, v.modelo, v.anio
    FROM vehiculos v
    INNER JOIN marcas_vehiculo m ON v.marca_id = m.id
    WHERE v.cliente_id = $1
    ORDER BY v.placa
  `,

  FIND_ALL_MARCAS: `
    SELECT id, nombre FROM marcas_vehiculo ORDER BY nombre
  `,
};