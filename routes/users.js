const express = require('express');
const router = express.Router();

const controller = require('../controllers/users');
const { authorize } = require('../middleware/authorize');
const { getUserOwnerId } = require('../utils/checkOwnership');

/* POST user create: solo admin (users:create:own esta registrado, pero aun no exite sign-up) */
router.post('/', authorize('users', 'create', 'any'), controller.create);

/* GET users listing */
router.get('/', authorize('users', 'read', 'any'), controller.list);

/* GET users by id: any, o own si es el propio usuario */
router.get('/:id', authorize('users', 'read', 'own', getUserOwnerId), controller.find);

/* PUT user to update. */
router.put('/:id', authorize('users', 'update', 'own', getUserOwnerId), controller.update);

/* DELETE user by id. */
   router.delete('/:id', authorize('users', 'delete', 'any'), controller.destroy);

module.exports = router;