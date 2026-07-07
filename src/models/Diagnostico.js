const db = require('../config/db');

class Diagnostico {

    static async ordenExiste(ordenId) {
        const result = await db.query(
            'SELECT id FROM ordenes_trabajo WHERE id = $1',
            [ordenId]
        );
        return !!result.rows[0];
    }

    static async findAll({ estado, q, orden_id, orden = 'desc' } = {}) {
        const condiciones = [];
        const values = [];
        let index = 1;

        if (estado) {
            condiciones.push(`d.estado = $${index++}`);
            values.push(estado);
        }

        if (orden_id) {
            condiciones.push(`d.orden_id = $${index++}`);
            values.push(orden_id);
        }

        if (q) {
            condiciones.push(`(
                d.descripcion_falla ILIKE $${index}
                OR d.observaciones ILIKE $${index}
                OR d.recomendaciones ILIKE $${index}
            )`);
            values.push(`%${q}%`);
            index++;
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const direccion = orden.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const result = await db.query(`
            SELECT
                d.*,
                u.nombre_completo AS mecanico
            FROM diagnosticos d
            LEFT JOIN usuarios u ON d.mecanico_id = u.id
            ${where}
            ORDER BY d.fecha_registro ${direccion}
        `, values);

        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT
                d.*,
                u.nombre_completo AS mecanico
            FROM diagnosticos d
            LEFT JOIN usuarios u ON d.mecanico_id = u.id
            WHERE d.id = $1
        `, [id]);

        return result.rows[0] || null;
    }

    static async findByOrden(ordenId) {
        const result = await db.query(`
            SELECT
                d.*,
                u.nombre_completo AS mecanico
            FROM diagnosticos d
            LEFT JOIN usuarios u ON d.mecanico_id = u.id
            WHERE d.orden_id = $1
            ORDER BY d.fecha_registro DESC
        `, [ordenId]);

        return result.rows;
    }

    static async create({ orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id }) {
        const result = await db.query(`
            INSERT INTO diagnosticos
                (orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id)
            VALUES ($1, $2, $3, $4, COALESCE($5::estado_diagnostico, 'pendiente'), $6)
            RETURNING *
        `, [
            orden_id,
            descripcion_falla,
            observaciones || null,
            recomendaciones || null,
            estado || null,
            mecanico_id || null
        ]);

        return result.rows[0];
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        let index = 1;

        if (data.descripcion_falla !== undefined) {
            fields.push(`descripcion_falla = $${index++}`);
            values.push(data.descripcion_falla);
        }
        if (data.recomendaciones !== undefined) {
            fields.push(`recomendaciones = $${index++}`);
            values.push(data.recomendaciones);
        }
        if (data.observaciones !== undefined) {
            fields.push(`observaciones = $${index++}`);
            values.push(data.observaciones);
        }

        if (fields.length === 0) return await this.findById(id);

        fields.push('fecha_actualizacion = now()');
        values.push(id);

        const result = await db.query(`
            UPDATE diagnosticos
            SET ${fields.join(', ')}
            WHERE id = $${index}
            RETURNING *
        `, values);

        return result.rows[0] || null;
    }

    static async updateObservaciones(id, observaciones) {
        const result = await db.query(`
            UPDATE diagnosticos
            SET observaciones = $1, fecha_actualizacion = now()
            WHERE id = $2
            RETURNING *
        `, [observaciones, id]);

        return result.rows[0] || null;
    }

    static async updateEstado(id, estado) {
        const result = await db.query(`
            UPDATE diagnosticos
            SET estado = $1, fecha_actualizacion = now()
            WHERE id = $2
            RETURNING *
        `, [estado, id]);

        return result.rows[0] || null;
    }
}

module.exports = Diagnostico;
