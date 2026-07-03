const express = require('express');
const router = express.Router();

const {
    crearVehiculo,
    actualizarVehiculo,
    obtenerVehiculo,
    listarVehiculos,
    listarMarcas,
    buscarVehiculos,
    historialVehiculo
} = require('../controllers/vehiculoController');

router.get('/marcas', listarMarcas);
router.get('/buscar', buscarVehiculos);

router.post('/', crearVehiculo);
router.get('/', listarVehiculos);
router.get('/:id', obtenerVehiculo);
router.get('/:id/historial', historialVehiculo);
router.put('/:id', actualizarVehiculo);

module.exports = router;
