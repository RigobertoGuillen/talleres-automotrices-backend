// prueba1
const Diagnostico = require('../models/Diagnostico');

const ESTADOS_VALIDOS = ['pendiente', 'en proceso', 'completado'];

const crearDiagnostico = async (req, res) => {
    try {
        const { orden_id, descripcion_falla, observaciones, recomendaciones, estado, mecanico_id } = req.body;

        if (!orden_id || !descripcion_falla) {
            return res.status(400).json({
                success: false,
                message: 'orden_id y descripcion_falla son obligatorios'
            });
        }

        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`
            });
        }

        const ordenExiste = await Diagnostico.ordenExiste(orden_id);
        if (!ordenExiste) {
            return res.status(404).json({
                success: false,
                message: 'La orden de trabajo indicada no existe'
            });
        }

        const diagnostico = await Diagnostico.create({
            orden_id,
            descripcion_falla,
            observaciones,
            recomendaciones,
            estado,
            mecanico_id: mecanico_id || req.usuario.id
        });

        return res.status(201).json({
            success: true,
            data: diagnostico
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar diagnóstico'
        });
    }
};

const listarDiagnosticos = async (req, res) => {
    try {
        const { estado, q, orden_id, orden } = req.query;

        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`
            });
        }

        const diagnosticos = await Diagnostico.findAll({ estado, q, orden_id, orden });

        return res.json({
            success: true,
            data: diagnosticos
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar diagnósticos'
        });
    }
};

const obtenerDiagnostico = async (req, res) => {
    try {
        const { id } = req.params;
        const diagnostico = await Diagnostico.findById(id);

        if (!diagnostico) {
            return res.status(404).json({
                success: false,
                message: 'Diagnóstico no encontrado'
            });
        }

        return res.json({
            success: true,
            data: diagnostico
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar diagnóstico'
        });
    }
};

const listarDiagnosticosPorOrden = async (req, res) => {
    try {
        const { ordenId } = req.params;

        const ordenExiste = await Diagnostico.ordenExiste(ordenId);
        if (!ordenExiste) {
            return res.status(404).json({
                success: false,
                message: 'La orden de trabajo indicada no existe'
            });
        }

        const diagnosticos = await Diagnostico.findByOrden(ordenId);

        return res.json({
            success: true,
            data: diagnosticos
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar el historial de diagnósticos de la orden'
        });
    }
};

const actualizarDiagnostico = async (req, res) => {
    try {
        const { id } = req.params;

        const diagnostico = await Diagnostico.update(id, req.body);

        if (!diagnostico) {
            return res.status(404).json({
                success: false,
                message: 'Diagnóstico no encontrado'
            });
        }

        return res.json({
            success: true,
            data: diagnostico
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar diagnóstico'
        });
    }
};

const actualizarObservaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;

        if (!observaciones || !observaciones.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Las observaciones no pueden estar vacías'
            });
        }

        const diagnostico = await Diagnostico.updateObservaciones(id, observaciones.trim());

        if (!diagnostico) {
            return res.status(404).json({
                success: false,
                message: 'Diagnóstico no encontrado'
            });
        }

        return res.json({
            success: true,
            message: 'Observaciones registradas correctamente',
            data: diagnostico
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar observaciones'
        });
    }
};

const actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`
            });
        }

        const diagnostico = await Diagnostico.updateEstado(id, estado);

        if (!diagnostico) {
            return res.status(404).json({
                success: false,
                message: 'Diagnóstico no encontrado'
            });
        }

        return res.json({
            success: true,
            message: 'Estado del diagnóstico actualizado correctamente',
            data: diagnostico
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado del diagnóstico'
        });
    }
};

module.exports = {
    crearDiagnostico,
    listarDiagnosticos,
    obtenerDiagnostico,
    listarDiagnosticosPorOrden,
    actualizarDiagnostico,
    actualizarObservaciones,
    actualizarEstado
};
