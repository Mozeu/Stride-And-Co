const express = require('express');
const router = express.Router();

const controller = require('../controllers/customers');

/* POST */
router.post('/', controller.create);

/* GET */
router.get('/', controller.list);

/* GET by ID */
router.get('/:id', controller.find);

/* PUT */
router.put('/:id', controller.update);

/* DELETE by ID. */
router.delete('/:id', controller.destroy);

module.exports = router;
