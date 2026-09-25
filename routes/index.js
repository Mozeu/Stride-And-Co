var express = require('express');
var router = express.Router();

const controller = require('../controllers/index');

/* GET home page. */
router.get('/', controller.home);

router.get('/health', controller.healthCheck);


module.exports = router;
