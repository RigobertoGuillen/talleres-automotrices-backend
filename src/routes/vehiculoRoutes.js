const express = require('express');
const router = express.Router();

const {
    crearVehiculo,
    actualizarVehiculo,
    obtenerVehiculo,
    listarVehiculos
} = require('../controllers/vehiculoController');

router.post('/', crearVehiculo);

router.put('/:id', actualizarVehiculo);

router.get('/', listarVehiculos);

router.get('/:id', obtenerVehiculo);

module.exports = router;