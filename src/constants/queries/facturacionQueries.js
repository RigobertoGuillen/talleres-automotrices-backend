module.exports = {
  // ── Autorizaciones CAI ────────────────────────────────────────────────
  CAI_FIND_ALL: `
    SELECT id, cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin,
           fecha_limite_emision, fecha_autorizacion, activo
    FROM autorizaciones_cai
    ORDER BY fecha_autorizacion DESC, id DESC
  `,

  CAI_FIND_BY_ID: `
    SELECT id, cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin,
           fecha_limite_emision, fecha_autorizacion, activo
    FROM autorizaciones_cai
    WHERE id = $1
  `,

  CAI_FIND_BY_CODIGO: `
    SELECT id FROM autorizaciones_cai WHERE cai = $1
  `,

  CAI_FIND_ACTIVO_VIGENTE: `
    SELECT id, cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin,
           fecha_limite_emision, fecha_autorizacion, activo
    FROM autorizaciones_cai
    WHERE activo = true AND fecha_limite_emision >= current_date
    ORDER BY id DESC
    LIMIT 1
  `,

  CAI_CREATE: `
    INSERT INTO autorizaciones_cai (cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin, fecha_limite_emision)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, cai, punto_emision, rango_autorizado_inicio, rango_autorizado_fin,
              fecha_limite_emision, fecha_autorizacion, activo
  `,

  CAI_FIND_ULTIMO_NUMERO: `
    SELECT numero_factura FROM facturas
    WHERE cai_id = $1
    ORDER BY numero_factura DESC
    LIMIT 1
  `,

  // ── Orden (datos fiscales para facturar) ─────────────────────────────
  ORDEN_FIND_PARA_FACTURA: `
    SELECT
      o.numero_orden, o.estado,
      c.dni AS cliente_dni,
      trim(c.primer_nombre || ' ' || COALESCE(c.segundo_nombre || ' ', '') || c.primer_apellido || ' ' || c.segundo_apellido) AS cliente_nombre,
      concat_ws(', ', d.calle, d.colonia, d.ciudad, d.departamento) AS cliente_direccion
    FROM ordenes_trabajo o
    JOIN vehiculos v ON v.id = o.vehiculo_id
    JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN direcciones d ON d.id = c.direccion_id
    WHERE o.numero_orden = $1
  `,

  ORDEN_SERVICIOS_PARA_FACTURAR: `
    SELECT
      os.id AS orden_servicio_id,
      sc.nombre || COALESCE(': ' || os.observaciones, '') AS descripcion,
      1 AS cantidad,
      os.precio_aplicado AS costo_unitario
    FROM orden_servicio os
    JOIN servicio_catalogo sc ON sc.id = os.servicio_id
    WHERE os.orden_id = $1
    ORDER BY os.id
  `,

  ORDEN_REPUESTOS_PARA_FACTURAR: `
    SELECT
      sr.id AS solicitud_repuesto_id,
      rp.nombre AS descripcion,
      sr.cantidad_solicitada AS cantidad,
      sr.precio_historico AS costo_unitario
    FROM solicitudes_repuestos sr
    JOIN repuestos rp ON rp.id = sr.repuesto_id
    WHERE sr.orden_id = $1
    ORDER BY sr.id
  `,

  // ── Facturas ──────────────────────────────────────────────────────────
  FACTURA_FIND_ALL: `
    SELECT
      f.id, f.orden_id, f.cai_id, ac.cai AS cai_codigo, f.numero_factura,
      f.cliente_dni, f.cliente_nombre, f.cliente_direccion, f.metodo_pago,
      f.subtotal_exento, f.subtotal_gravado_15, f.isv_15, f.total, f.fecha_emision
    FROM facturas f
    JOIN autorizaciones_cai ac ON ac.id = f.cai_id
    ORDER BY f.fecha_emision DESC
  `,

  FACTURA_FIND_BY_ID: `
    SELECT
      f.id, f.orden_id, f.cai_id, ac.cai AS cai_codigo, f.numero_factura,
      f.cliente_dni, f.cliente_nombre, f.cliente_direccion, f.metodo_pago,
      f.subtotal_exento, f.subtotal_gravado_15, f.isv_15, f.total, f.fecha_emision
    FROM facturas f
    JOIN autorizaciones_cai ac ON ac.id = f.cai_id
    WHERE f.id = $1
  `,

  FACTURA_FIND_BY_ORDEN: `
    SELECT
      f.id, f.orden_id, f.cai_id, ac.cai AS cai_codigo, f.numero_factura,
      f.cliente_dni, f.cliente_nombre, f.cliente_direccion, f.metodo_pago,
      f.subtotal_exento, f.subtotal_gravado_15, f.isv_15, f.total, f.fecha_emision
    FROM facturas f
    JOIN autorizaciones_cai ac ON ac.id = f.cai_id
    WHERE f.orden_id = $1
  `,

  FACTURA_CREATE: `
    INSERT INTO facturas (orden_id, cai_id, numero_factura, cliente_dni, cliente_nombre, cliente_direccion)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, orden_id, cai_id, numero_factura, cliente_dni, cliente_nombre,
              cliente_direccion, metodo_pago, subtotal_exento, subtotal_gravado_15,
              isv_15, total, fecha_emision
  `,

  FACTURA_UPDATE_METODO_PAGO: `
    UPDATE facturas
    SET metodo_pago = $1
    WHERE id = $2
    RETURNING id, orden_id, cai_id, numero_factura, cliente_dni, cliente_nombre,
              cliente_direccion, metodo_pago, subtotal_exento, subtotal_gravado_15,
              isv_15, total, fecha_emision
  `,

  // ── Detalle de factura ────────────────────────────────────────────────
  FACTURA_DETALLE_FIND_BY_FACTURA: `
    SELECT id, factura_id, tipo, orden_servicio_id, solicitud_repuesto_id,
           descripcion, cantidad, costo_unitario, monto_gravado
    FROM factura_detalle
    WHERE factura_id = $1
    ORDER BY id
  `,

  FACTURA_DETALLE_INSERT_SERVICIO: `
    INSERT INTO factura_detalle (factura_id, tipo, orden_servicio_id, descripcion, cantidad, costo_unitario)
    VALUES ($1, 'servicio', $2, $3, $4, $5)
    RETURNING id, factura_id, tipo, orden_servicio_id, descripcion, cantidad, costo_unitario, monto_gravado
  `,

  FACTURA_DETALLE_INSERT_REPUESTO: `
    INSERT INTO factura_detalle (factura_id, tipo, solicitud_repuesto_id, descripcion, cantidad, costo_unitario)
    VALUES ($1, 'repuesto', $2, $3, $4, $5)
    RETURNING id, factura_id, tipo, solicitud_repuesto_id, descripcion, cantidad, costo_unitario, monto_gravado
  `
};
