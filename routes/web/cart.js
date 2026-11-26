const express = require('express');
const createError = require('http-errors');
const storeLanguage = require('../../middleware/storeLanguage');
const cart = require('../../controllers/web/cart');

const router = express.Router();

router.use('/cart', (req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  if (req.method === 'POST' && req.get('Sec-Fetch-Site') === 'cross-site') {
    return next(createError(403));
  }
  return next();
});
router.get('/cart', storeLanguage, cart.show);
router.post('/cart/items', cart.add);
router.post('/cart/items/:variantId', cart.update);
router.post('/cart/items/:variantId/delete', cart.remove);

module.exports = router;
