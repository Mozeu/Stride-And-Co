const express = require('express');
const router = express.Router();

const controller = require('../controllers/users');
const { authorize } = require('../middleware/authorize');

/* POST user create */
router.post('/', controller.create);

/* GET users listing. */
router.get('/', authorize('users', 'read', 'any'), controller.list);

/* GET users by id. */
router.get('/:id', authorize('users', 'read', 'any'), controller.find);

/* PUT user to update. */
router.put('/:id', controller.update);

/* DELETE user by id. */
router.delete('/:id', controller.destroy);

module.exports = router;
