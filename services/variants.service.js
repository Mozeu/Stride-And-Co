const { Product, Variant, Inventory } = require('../models/sql');

function includes(publicOnly = false) {
  const product = { model: Product, as: 'product' };
  if (publicOnly) product.where = { active: true };
  return [product, { model: Inventory, as: 'inventory' }];
}

function list() {
  return Variant.findAll({ include: includes() });
}

function find(id) {
  return Variant.findByPk(id, { include: includes() });
}

function forStore(ids) {
  const where = { active: true };
  if (ids !== undefined) where.id = ids;
  return Variant.findAll({
    where,
    include: includes(true),
    order: [['id', 'ASC']]
  });
}

function available(variant) {
  const inventory = variant?.inventory;
  return inventory ? Math.max(0, inventory.stock - inventory.reserved) : 0;
}

module.exports = { list, find, forStore, available };
