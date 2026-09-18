const express = require('express');
const router = express.Router();

const controller = require('../controllers/orders');

/* POST */
router.post('/', controller.create);

/* GET */
router.get('/', controller.list);

/* GET by ID */
router.get('/:id', controller.find);

/* PUT */
router.put('/:id', controller.update);

module.exports = router;
