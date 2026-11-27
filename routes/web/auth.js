const express = require('express');
const router = express.Router();

const controller = require('../../controllers/web/auth');
const storeLanguage = require('../../middleware/storeLanguage');

router.get('/login', storeLanguage, controller.showLogin);
router.post('/login', storeLanguage, controller.login);
router.post('/logout', controller.logout);

module.exports = router;
