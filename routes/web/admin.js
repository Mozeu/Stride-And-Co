const express = require('express');
const { requireLogin } = require('../../middleware/session');
const { authorize } = require('../../middleware/authorize');
const storeLanguage = require('../../middleware/storeLanguage');
const admin = require('../../controllers/web/admin');

const router = express.Router();
const canReadProducts = authorize('products', 'read', 'any');
const canReadOrders = authorize('orders', 'read', 'any');

function preventCaching(req, res, next) {
  res.set('Cache-Control', 'private, no-store');
  return next();
}

router.get('/admin',
  preventCaching,
  requireLogin,
  canReadProducts,
  canReadOrders,
  storeLanguage,
  admin.dashboard
);

module.exports = router;
