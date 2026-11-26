const express = require('express');
const router = express.Router();

const controller = require('../../controllers/index');

/* GET home page. */
router.get('/', controller.home);

router.get('/health', controller.healthCheck);
router.use(require('./cart'));


module.exports = router;
