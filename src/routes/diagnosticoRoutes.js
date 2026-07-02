const express = require('express');
const router = express.Router();

const {
    crearDiagnostico,
    listarDiagnosticos,
    obtenerDiagnostico,
    listarDiagnosticosPorOrden,
    actualizarDiagnostico,
    actualizarObservaciones,
    actualizarEstado
} = require('../controllers/diagnosticoController');

const { verificarToken, verificarRol } = require('../middlewares/auth');

router.use(verificarToken);

router.post(
    '/',
    verificarRol('administrador', 'mecanico'),
    crearDiagnostico
);

router.get(
    '/',
    verificarRol('administrador', 'mecanico', 'recepcionista'),
    listarDiagnosticos
);

router.get(
    '/orden/:ordenId',
    verificarRol('administrador', 'mecanico', 'recepcionista'),
    listarDiagnosticosPorOrden
);

router.get(
    '/:id',
    verificarRol('administrador', 'mecanico', 'recepcionista'),
    obtenerDiagnostico
);

router.put(
    '/:id',
    verificarRol('administrador', 'mecanico'),
    actualizarDiagnostico
);

router.patch(
    '/:id/observaciones',
    verificarRol('administrador', 'mecanico'),
    actualizarObservaciones
);

router.patch(
    '/:id/estado',
    verificarRol('administrador', 'mecanico'),
    actualizarEstado
);

module.exports = router;
