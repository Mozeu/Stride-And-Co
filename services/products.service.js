const { Op } = require('sequelize');
const { Product, Variant, Inventory } = require('../models/sql');

const productIncludes = [{
  model: Variant,
  as: 'variants',
  include: [{ model: Inventory, as: 'inventory' }]
}];

const newestFirst = [['createdAt', 'DESC'], ['id', 'DESC']];

function list() {
  return Product.findAll({ include: productIncludes });
}

function find(id) {
  return Product.findByPk(id, { include: productIncludes });
}

function featured() {
  return Product.findAll({ where: { active: true }, order: newestFirst, limit: 4 });
}

async function categories() {
  const rows = await Product.findAll({
    attributes: ['category_id'],
    where: { active: true, category_id: { [Op.ne]: null } },
    group: ['category_id'],
    order: [['category_id', 'ASC']],
    raw: true
  });
  return rows.map(row => row.category_id);
}

async function catalog({ q, category, page }) {
  const pageSize = 12;
  const where = { active: true };

  if (category !== null) where.category_id = category;
  if (q) {
    const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    where[Op.or] = [
      { name: { [Op.iLike]: pattern } },
      { brand: { [Op.iLike]: pattern } }
    ];
  }

  const count = await Product.count({ where });
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);
  const products = await Product.findAll({
    where,
    order: newestFirst,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize
  });
  return { products, currentPage, totalPages };
}

// Administración: incluye productos inactivos
async function adminList({ q, page }) {
  const pageSize = 10;
  const where = {};

  if (q) {
    const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    where[Op.or] = [
      { name: { [Op.iLike]: pattern } },
      { brand: { [Op.iLike]: pattern } }
    ];
  }

  const count = await Product.count({ where });
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);
  const products = await Product.findAll({
    where,
    order: newestFirst,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize
  });
  return { products, currentPage, totalPages };
}

function create(attributes) {
  return Product.create(attributes);
}

// Devuelve null si el producto no existe
async function update(id, attributes) {
  const product = await Product.findByPk(id);
  if (!product) return null;
  await product.update(attributes);
  return product;
}

// Devuelve null si el producto no existe
async function remove(id) {
  const product = await Product.findByPk(id);
  if (!product) return null;
  await product.destroy();
  return product;
}

module.exports = { list, find, featured, categories, catalog, adminList, create, update, remove };
