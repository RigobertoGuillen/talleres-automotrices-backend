const db = require('../config/db');

class Vehiculo {

    static async findAll() {
        const result = await db.query(`
            SELECT v.id, v.placa, m.id AS marca_id, m.nombre AS marca,
                   v.modelo, v.anio, v.color, v.tipo, v.cliente_id, v.fecha_registro
            FROM vehiculos v
            JOIN marcas_vehiculo m ON v.marca_id = m.id
            ORDER BY v.id
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT v.*, m.nombre AS marca
            FROM vehiculos v
            JOIN marcas_vehiculo m ON v.marca_id = m.id
            WHERE v.id = $1
        `, [id]);
        return result.rows[0] || null;
    }

    static async findByPlaca(placa) {
        const result = await db.query(`
            SELECT v.*, m.nombre AS marca
            FROM vehiculos v
            JOIN marcas_vehiculo m ON v.marca_id = m.id
            WHERE v.placa = $1
        `, [placa]);
        return result.rows[0] || null;
    }

    static async create(data) {
        const { placa, marca_id, modelo, anio, color, tipo, cliente_id } = data;
        const result = await db.query(`
            INSERT INTO vehiculos (placa, marca_id, modelo, anio, color, tipo, cliente_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
        `, [placa, marca_id, modelo, anio, color, tipo, cliente_id]);
        return result.rows[0];
    }

    static async update(id, data) {
        const { placa, marca_id, modelo, anio, color, tipo, cliente_id } = data;
        const result = await db.query(`
            UPDATE vehiculos
            SET placa=$1, marca_id=$2, modelo=$3, anio=$4, color=$5, tipo=$6, cliente_id=$7
            WHERE id=$8
            RETURNING *
        `, [placa, marca_id, modelo, anio, color, tipo, cliente_id, id]);
        return result.rows[0] || null;
    }

    static async buscar(q) {
        const result = await db.query(`
            SELECT v.id, v.placa, m.id AS marca_id, m.nombre AS marca,
                   v.modelo, v.anio, v.color, v.tipo, v.cliente_id, v.fecha_registro
            FROM vehiculos v
            JOIN marcas_vehiculo m ON v.marca_id = m.id
            WHERE v.placa ILIKE $1 OR m.nombre ILIKE $1 OR v.modelo ILIKE $1
            ORDER BY v.id
        `, [`%${q}%`]);
        return result.rows;
    }

    static async historial(vehiculoId) {
        const result = await db.query(`
            SELECT ot.id, ot.numero_orden, ot.fecha_ingreso, ot.descripcion_problema,
                   ot.estado, ot.prioridad, ot.fecha_creacion,
                   u.nombre_completo AS mecanico
            FROM ordenes_trabajo ot
            LEFT JOIN usuarios u ON ot.mecanico_id = u.id
            WHERE ot.vehiculo_id = $1
            ORDER BY ot.fecha_ingreso DESC
        `, [vehiculoId]);
        return result.rows;
    }

    // Antes devolvía una lista hardcodeada de 15 marcas cuyos IDs no
    // coincidían con la tabla real marcas_vehiculo (10 filas, otro orden).
    // Ahora se consulta directamente la tabla, que es la fuente de verdad.
    static async findAllMarcas() {
        const result = await db.query(`
            SELECT id, nombre FROM marcas_vehiculo ORDER BY nombre
        `);
        return result.rows;
    }
}

module.exports = Vehiculo;