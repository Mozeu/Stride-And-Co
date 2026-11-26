const { URLSearchParams } = require('node:url');
const productsService = require('../../services/products.service');

function integer(value) {
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function pageUrl({ q, category, locale }, page) {
  const params = new URLSearchParams({ lang: locale });
  if (q) params.set('q', q);
  if (category !== null) params.set('category', category);
  if (page > 1) params.set('page', page);
  return '/products?' + params.toString();
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

async function home(req, res, next) {
  try {
    const products = await productsService.featured();
    return res.render('store/home', {
      title: req.__('store.home') + ' | Stride & Co',
      metaDescription: req.__('store.landing.description'),
      products,
      locale: req.getLocale()
    });
  } catch (error) {
    return next(error);
  }
}

async function catalog(req, res, next) {
  try {
    const locale = req.getLocale();
    const q = typeof req.query.q === 'string'
      ? Array.from(req.query.q.replaceAll('\u0000', '').trim()).slice(0, 150).join('')
      : '';
    const categoryId = integer(req.query.category);
    const category = categoryId !== null && categoryId >= -2147483648 && categoryId <= 2147483647 ? categoryId : null;
    const page = Math.max(1, integer(req.query.page) || 1);
    const filters = { q, category, locale };
    const [{ products, currentPage, totalPages }, categories] = await Promise.all([
      productsService.catalog({ ...filters, page }),
      productsService.categories()
    ]);
    return res.render('store/catalog', {
      title: req.__('store.catalog.title') + ' | Stride & Co',
      metaDescription: req.__('store.catalog.description'),
      locale,
      q,
      category,
      categories,
      products,
      pagination: makePagination(filters, currentPage, totalPages)
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { home, catalog };
