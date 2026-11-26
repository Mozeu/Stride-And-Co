const express = require('express');
const { requireLogin } = require('../../middleware/session');
const { authorize } = require('../../middleware/authorize');
const storeLanguage = require('../../middleware/storeLanguage');
const orders = require('../../controllers/web/my-orders');

const router = express.Router();
const canReadOwnOrders = authorize('orders', 'read', 'own', null, { strictOwn: true });

function preventCaching(req, res, next) {
  res.set('Cache-Control', 'private, no-store');
  return next();
}

const protectedOrderPage = [preventCaching, requireLogin, canReadOwnOrders, storeLanguage];

router.get('/my/orders', protectedOrderPage, orders.list);
router.get('/my/orders/:id', protectedOrderPage, orders.detail);

router.use((error, req, res, next) => {
  if (error.status !== 403) return next(error);
  return res.status(403).render('errors/403', {
    title: req.__('webErrors.forbiddenTitle'),
    locale: req.getLocale()
  });
});

module.exports = router;
