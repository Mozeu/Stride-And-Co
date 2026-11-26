const express = require('express');
const router = express.Router();

const controller = require('../../controllers/index');

router.use(require('./catalog'));

router.get('/health', controller.healthCheck);
router.use(require('./cart'));


module.exports = router;
