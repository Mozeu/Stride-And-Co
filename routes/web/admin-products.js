const express = require('express');
const { requireLogin } = require('../../middleware/session');
const { authorize } = require('../../middleware/authorize');
const storeLanguage = require('../../middleware/storeLanguage');
const controller = require('../../controllers/web/admin-products');

const router = express.Router();

function preventCaching(req, res, next) {
  res.set('Cache-Control', 'private, no-store');
  return next();
}

router.use(preventCaching, requireLogin, storeLanguage);

// products:read:any lo tienen también los clientes; update:any deja la pantalla solo para administración
const canManage = [authorize('products', 'read', 'any'), authorize('products', 'update', 'any')];
const canCreate = authorize('products', 'create', 'any');
const canUpdate = authorize('products', 'update', 'any');
const canDelete = authorize('products', 'delete', 'any');

router.get('/', canManage, controller.index);
router.get('/new', canCreate, controller.newForm);
router.post('/', canCreate, controller.create);
router.get('/:id/edit', canUpdate, controller.editForm);
router.post('/:id', canUpdate, controller.update);
router.post('/:id/active', canUpdate, controller.toggleActive);
router.post('/:id/delete', canDelete, controller.remove);

module.exports = router;
