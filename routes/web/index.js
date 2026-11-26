const express = require('express');
const router = express.Router();

const controller = require('../../controllers/index');

router.use(require('./catalog'));

router.get('/health', controller.healthCheck);


module.exports = router;
