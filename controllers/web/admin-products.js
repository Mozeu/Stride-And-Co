const createError = require('http-errors');
const { URLSearchParams } = require('node:url');
const productsService = require('../../services/products.service');
const productCategoryIds = require('../../config/product-categories');
const { setFlash } = require('../../middleware/flash');

const MAX_ID = 2147483647;
const PRICE_REGEX = /^\d{1,8}(\.\d{1,2})?$/;

function parseId(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 && id <= MAX_ID ? id : null;
}

function cleanText(value) {
  return typeof value === 'string' ? value.replaceAll('\u0000', '').trim() : '';
}

function categoryOptions(req) {
  return Object.entries(productCategoryIds).map(([key, id]) => ({
    id,
    label: req.__('store.catalog.categories.' + key)
  }));
}

function pageUrl({ q, locale }, page) {
  const params = new URLSearchParams({ lang: locale });
  if (q) params.set('q', q);
  if (page > 1) params.set('page', page);
  return '/admin/products?' + params.toString();
}

function makePagination(filters, currentPage, totalPages) {
  if (totalPages < 2) return null;

  const first = Math.max(1, currentPage - 2);
  const last = Math.min(totalPages, currentPage + 2);
  const pages = [];
  for (let number = first; number <= last; number++) {
    pages.push({ number, current: number === currentPage, url: pageUrl(filters, number) });
  }
  return {
    pages,
    previousUrl: currentPage > 1 ? pageUrl(filters, currentPage - 1) : null,
    nextUrl: currentPage < totalPages ? pageUrl(filters, currentPage + 1) : null
  };
}

// Valida en el servidor lo que mandó el formulario. Devuelve lo capturado (values) y los errores traducidos por campo.
function readForm(req) {
  const body = req.body || {};
  const values = {
    name: cleanText(body.name),
    brand: cleanText(body.brand),
    description: cleanText(body.description),
    price: cleanText(body.price),
    category_id: cleanText(body.category_id),
    active: body.active === 'on'
  };
  const errors = {};

  if (!values.name) errors.name = req.__('admin.products.errors.name');
  else if (Array.from(values.name).length > 150) errors.name = req.__('admin.products.errors.nameLength');

  if (Array.from(values.brand).length > 100) errors.brand = req.__('admin.products.errors.brand');
  if (Array.from(values.description).length > 2000) errors.description = req.__('admin.products.errors.description');

  const price = values.price.replace(',', '.');
  if (!PRICE_REGEX.test(price)) errors.price = req.__('admin.products.errors.price');

  const validCategories = Object.values(productCategoryIds).map(String);
  if (values.category_id && !validCategories.includes(values.category_id)) {
    errors.category = req.__('admin.products.errors.category');
  }

  const attributes = {
    name: values.name,
    brand: values.brand || null,
    description: values.description || null,
    price,
    category_id: values.category_id ? Number(values.category_id) : null,
    active: values.active
  };
  return { values, errors, attributes };
}

function renderForm(req, res, { status = 200, product = null, values, errors = {} }) {
  const editing = Boolean(product);
  return res.status(status).render('admin/products/form', {
    title: req.__(editing ? 'admin.products.editTitle' : 'admin.products.newTitle') + ' | Stride & Co',
    metaDescription: req.__('admin.products.formDescription'),
    locale: req.getLocale(),
    product,
    values,
    errors,
    categories: categoryOptions(req),
    action: editing ? '/admin/products/' + product.id : '/admin/products'
  });
}

async function findOr404(req) {
  const id = parseId(req.params.id);
  const product = id ? await productsService.find(id) : null;
  if (!product) throw createError(404);
  return product;
}

async function index(req, res, next) {
  try {
    const locale = req.getLocale();
    const q = typeof req.query.q === 'string'
      ? Array.from(cleanText(req.query.q)).slice(0, 150).join('')
      : '';
    const requested = parseId(req.query.page) || 1;
    const { products, currentPage, totalPages } = await productsService.adminList({ q, page: requested });
    const money = new Intl.NumberFormat(locale === 'en' ? 'en-MX' : 'es-MX', { style: 'currency', currency: 'MXN' });
    const labels = new Map(categoryOptions(req).map(category => [category.id, category.label]));

    return res.render('admin/products/index', {
      title: req.__('admin.products.title') + ' | Stride & Co',
      metaDescription: req.__('admin.products.description'),
      locale,
      q,
      products,
      pagination: makePagination({ q, locale }, currentPage, totalPages),
      money: value => money.format(Number(value)),
      categoryLabel: id => labels.get(id) || '—'
    });
  } catch (error) {
    return next(error);
  }
}

function newForm(req, res) {
  return renderForm(req, res, {
    values: { name: '', brand: '', description: '', price: '', category_id: '', active: true }
  });
}

async function create(req, res, next) {
  try {
    const { values, errors, attributes } = readForm(req);
    if (Object.keys(errors).length > 0) {
      return renderForm(req, res, { status: 400, values, errors });
    }

    await productsService.create(attributes);
    setFlash(res, 'success', 'admin.products.created');
    return res.redirect('/admin/products');
  } catch (error) {
    return next(error);
  }
}

async function editForm(req, res, next) {
  try {
    const product = await findOr404(req);
    return renderForm(req, res, {
      product,
      values: {
        name: product.name,
        brand: product.brand || '',
        description: product.description || '',
        price: String(product.price),
        category_id: product.category_id == null ? '' : String(product.category_id),
        active: product.active
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const product = await findOr404(req);
    const { values, errors, attributes } = readForm(req);
    if (Object.keys(errors).length > 0) {
      return renderForm(req, res, { status: 400, product, values, errors });
    }

    const updated = await productsService.update(product.id, attributes);
    if (!updated) throw createError(404);
    setFlash(res, 'success', 'admin.products.updated');
    return res.redirect('/admin/products');
  } catch (error) {
    return next(error);
  }
}

async function toggleActive(req, res, next) {
  try {
    const product = await findOr404(req);
    const active = !product.active;
    const updated = await productsService.update(product.id, { active });
    if (!updated) throw createError(404);
    setFlash(res, 'success', active ? 'admin.products.activated' : 'admin.products.deactivated');
    return res.redirect('/admin/products');
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const product = await findOr404(req);

    // Regla de negocio: no se borra un producto con variantes; se desactiva
    if (product.variants && product.variants.length > 0) {
      setFlash(res, 'error', 'admin.products.hasVariants');
      return res.redirect('/admin/products');
    }

    const removed = await productsService.remove(product.id);
    if (!removed) throw createError(404);
    setFlash(res, 'success', 'admin.products.deleted');
    return res.redirect('/admin/products');
  } catch (error) {
    return next(error);
  }
}

module.exports = { index, newForm, create, editForm, update, toggleActive, remove };
