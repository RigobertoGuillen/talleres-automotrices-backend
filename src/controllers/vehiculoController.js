const Vehiculo = require('../models/Vehiculo');

const TIPOS_VALIDOS = [
    'Pickup',
    'turismo',
    'camioneta'
];

const crearVehiculo = async (req, res) => {
    try {

        const {
            placa,
            marca,
            modelo,
            anio,
            color,
            tipo,
            cliente_id
        } = req.body;

        if (!placa || !marca || !modelo || !anio || !tipo || !cliente_id) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben enviarse'
            });
        }

        const anioActual = new Date().getFullYear();

        if (anio < 1950 || anio > anioActual + 1) {
            return res.status(400).json({
                success: false,
                message: 'Año inválido'
            });
        }

        if (!TIPOS_VALIDOS.includes(tipo)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de vehículo inválido'
            });
        }

        const placaExistente = await Vehiculo.findByPlaca(placa);

        if (placaExistente) {
            return res.status(409).json({
                success: false,
                message: 'La placa ya existe'
            });
        }

        const vehiculo = await Vehiculo.create(req.body);

        return res.status(201).json({
            success: true,
            data: vehiculo
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al registrar vehículo'
        });
    }
};

const actualizarVehiculo = async (req, res) => {
    try {

        const { id } = req.params;

        const vehiculo = await Vehiculo.update(id, req.body);

        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        return res.json({
            success: true,
            data: vehiculo
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al actualizar vehículo'
        });
    }
};

const obtenerVehiculo = async (req, res) => {

    try {

        const { id } = req.params;

        const vehiculo = await Vehiculo.findById(id);

        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        return res.json({
            success: true,
            data: vehiculo
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al consultar vehículo'
        });
    }
};

const listarVehiculos = async (req, res) => {

    try {

        const vehiculos = await Vehiculo.findAll();

        return res.json({
            success: true,
            data: vehiculos
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Error al listar vehículos'
        });
    }
};

const listarMarcas = async (req, res) => {
    try {
        const marcas = await Vehiculo.findAllMarcas();
        return res.json({ success: true, data: marcas });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al listar marcas' });
    }
};

const buscarVehiculos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            const vehiculos = await Vehiculo.findAll();
            return res.json({ success: true, data: vehiculos });
        }
        const vehiculos = await Vehiculo.buscar(q.trim());
        return res.json({ success: true, data: vehiculos });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al buscar vehículos' });
    }
};

const historialVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const historial = await Vehiculo.historial(id);
        return res.json({ success: true, data: historial });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al obtener historial' });
    }
};

module.exports = {
    crearVehiculo,
    actualizarVehiculo,
    obtenerVehiculo,
    listarVehiculos,
    listarMarcas,
    buscarVehiculos,
    historialVehiculo
};