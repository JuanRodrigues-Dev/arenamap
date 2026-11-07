const express = require('express');
const router = express.Router();
const sportsController = require('../controllers/sportsController');

// Consultas Espaciais PostGIS
router.get('/bounds', sportsController.getInBounds);
router.get('/nearby', sportsController.getNearby);

// Operações CRUD
router.post('/', sportsController.createSpace);
router.get('/:id', sportsController.getSpaceById);
router.put('/:id', sportsController.updateSpace);
router.delete('/:id', sportsController.deleteSpace);

module.exports = router;