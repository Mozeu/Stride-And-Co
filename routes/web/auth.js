const express = require('express');
const router = express.Router();

const controller = require('../../controllers/web/auth');

router.get('/login', controller.showLogin);
router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;
