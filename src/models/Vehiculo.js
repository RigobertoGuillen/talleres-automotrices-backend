const db = require('../config/db');

class Vehiculo {

    static async findAll() {
        const result = await db.query(`
            SELECT
                v.id,
                v.placa,
                mv.nombre AS marca,
                v.marca_id,
                v.modelo,
                v.anio,
                v.color,
                v.tipo,
                v.cliente_id,
                v.fecha_registro
            FROM vehiculos v
            INNER JOIN marcas_vehiculo mv
                ON v.marca_id = mv.id
            ORDER BY v.id
        `);

        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT
                v.*,
                mv.nombre AS marca
            FROM vehiculos v
            INNER JOIN marcas_vehiculo mv
                ON v.marca_id = mv.id
            WHERE v.id = $1
        `, [id]);

        return result.rows[0] || null;
    }

    static async findByPlaca(placa) {
        const result = await db.query(
            'SELECT * FROM vehiculos WHERE placa = $1',
            [placa]
        );

        return result.rows[0] || null;
    }

    static async create(data) {

        const {
            placa,
            marca_id,
            modelo,
            anio,
            color,
            tipo,
            cliente_id
        } = data;

        const result = await db.query(`
            INSERT INTO vehiculos
            (
                placa,
                marca_id,
                modelo,
                anio,
                color,
                tipo,
                cliente_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
        `,
        [
            placa,
            marca_id,
            modelo,
            anio,
            color,
            tipo,
            cliente_id
        ]);

        return result.rows[0];
    }

    static async update(id, data) {

        const {
            placa,
            marca_id,
            modelo,
            anio,
            color,
            tipo,
            cliente_id
        } = data;

        const result = await db.query(`
            UPDATE vehiculos
            SET
                placa = $1,
                marca_id = $2,
                modelo = $3,
                anio = $4,
                color = $5,
                tipo = $6,
                cliente_id = $7
            WHERE id = $8
            RETURNING *
        `,
        [
            placa,
            marca_id,
            modelo,
            anio,
            color,
            tipo,
            cliente_id,
            id
        ]);

        return result.rows[0] || null;
    }
}

module.exports = Vehiculo;