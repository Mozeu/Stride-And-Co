const express = require('express');
const catalog = require('../../controllers/web/catalog');
const storeLanguage = require('../../middleware/storeLanguage');

const router = express.Router();

router.get('/', storeLanguage, catalog.home);
router.get('/products', storeLanguage, catalog.catalog);

module.exports = router;
