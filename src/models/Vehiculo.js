const db = require('../config/db');

class Vehiculo {

    static async findAll() {
        const result = await db.query(`
            SELECT id, placa, marca, modelo, anio, color, tipo, cliente_id, fecha_registro
            FROM vehiculos
            ORDER BY id
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT * FROM vehiculos WHERE id = $1', [id]
        );
        return result.rows[0] || null;
    }

    static async findByPlaca(placa) {
        const result = await db.query(
            'SELECT * FROM vehiculos WHERE placa = $1', [placa]
        );
        return result.rows[0] || null;
    }

    static async create(data) {
        const { placa, marca, modelo, anio, color, tipo, cliente_id } = data;
        const result = await db.query(`
            INSERT INTO vehiculos (placa, marca, modelo, anio, color, tipo, cliente_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
        `, [placa, marca, modelo, anio, color, tipo, cliente_id]);
        return result.rows[0];
    }

    static async update(id, data) {
        const { placa, marca, modelo, anio, color, tipo, cliente_id } = data;
        const result = await db.query(`
            UPDATE vehiculos
            SET placa=$1, marca=$2, modelo=$3, anio=$4, color=$5, tipo=$6, cliente_id=$7
            WHERE id=$8
            RETURNING *
        `, [placa, marca, modelo, anio, color, tipo, cliente_id, id]);
        return result.rows[0] || null;
    }

    static async buscar(q) {
        const result = await db.query(`
            SELECT id, placa, marca, modelo, anio, color, tipo, cliente_id, fecha_registro
            FROM vehiculos
            WHERE placa ILIKE $1 OR marca ILIKE $1 OR modelo ILIKE $1
            ORDER BY id
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

    static async findAllMarcas() {
        return [
            { id: 1, nombre: 'Toyota' }, { id: 2, nombre: 'Honda' },
            { id: 3, nombre: 'Nissan' }, { id: 4, nombre: 'Chevrolet' },
            { id: 5, nombre: 'Ford' }, { id: 6, nombre: 'Hyundai' },
            { id: 7, nombre: 'Kia' }, { id: 8, nombre: 'Mazda' },
            { id: 9, nombre: 'Mitsubishi' }, { id: 10, nombre: 'Suzuki' },
            { id: 11, nombre: 'Volkswagen' }, { id: 12, nombre: 'BMW' },
            { id: 13, nombre: 'Mercedes-Benz' }, { id: 14, nombre: 'Jeep' },
            { id: 15, nombre: 'Dodge' }
        ];
    }
}

module.exports = Vehiculo;