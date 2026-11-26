const createError = require('http-errors');
const { setFlash } = require('../../middleware/flash');
const cartService = require('../../services/cart.service');

const cartCookie = 'stride_cart';
const maxLines = 50;
const maxQuantity = 999;
const maxId = 2147483647;
const oneDay = 24 * 60 * 60 * 1000;
const confirmations = { add: 'added', update: 'updated', remove: 'removed' };

function cookieOptions(req) {
  return { path: '/cart', httpOnly: true, sameSite: 'lax', secure: req.secure || req.app.get('env') === 'production' };
}

function integer(value, max) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return number > 0 && number <= max ? number : null;
}

function validItem(item) {
  return item && Number.isInteger(item.variantId) && item.variantId > 0 &&
    item.variantId <= maxId && Number.isInteger(item.quantity) &&
    item.quantity > 0 && item.quantity <= maxQuantity;
}

function readCart(req) {
  const saved = req.signedCookies[cartCookie];
  if (!Array.isArray(saved)) return [];
  const items = new Map();
  for (const item of saved.slice(0, maxLines)) {
    if (validItem(item)) items.set(item.variantId, { variantId: item.variantId, quantity: item.quantity });
  }
  return [...items.values()];
}

async function render(req, res, items, { status = 200, error, form } = {}) {
  const cart = await cartService.getCart(items);
  const locale = req.getLocale();
  const currency = new Intl.NumberFormat(locale === 'en' ? 'en-MX' : 'es-MX', {
    style: 'currency', currency: 'MXN'
  });
  return res.status(status).render('store/cart', {
    title: req.__('store.cart.title') + ' | Stride & Co',
    metaDescription: req.__('store.cart.description'),
    locale,
    ...cart,
    money: cents => currency.format(cents / 100),
    form,
    error: error ? req.__('store.cart.' + error) : null
  });
}

async function show(req, res, next) {
  try {
    return await render(req, res, readCart(req));
  } catch (error) {
    return next(error);
  }
}

function change(action) {
  return async (req, res, next) => {
    try {
      const items = readCart(req);
      const adding = action === 'add';
      const removing = action === 'remove';
      const variantId = integer(adding ? req.body?.variantId : req.params.variantId, maxId);
      const submitted = req.body?.quantity;
      const quantity = integer(submitted, maxQuantity);
      const form = { action, variantId, quantity: typeof submitted === 'string' ? submitted.slice(0, 32) : '' };
      const invalid = error => render(req, res, items, { status: 400, error, form });

      if (!variantId) return await invalid('invalidVariant');
      const current = items.find(item => item.variantId === variantId);
      if (!adding && !current) return next(createError(404));

      if (removing) {
        items.splice(items.indexOf(current), 1);
      } else {
        if (!quantity) return await invalid('invalidQuantity');
        const available = await cartService.getAvailability(variantId);
        if (available === null) return next(createError(404));

        const desired = adding ? (current?.quantity || 0) + quantity : quantity;
        if (desired > available) return await invalid('insufficientStock');
        if (desired > maxQuantity) return await invalid('invalidQuantity');
        if (!current && items.length >= maxLines) return await invalid('full');
        if (current) current.quantity = desired;
        else items.push({ variantId, quantity: desired });
      }

      const options = cookieOptions(req);
      if (items.length) res.cookie(cartCookie, items, { ...options, signed: true, maxAge: 30 * oneDay });
      else res.clearCookie(cartCookie, options);
      setFlash(res, 'success', 'store.cart.' + confirmations[action]);
      return res.redirect('/cart?lang=' + req.getLocale());
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { show, add: change('add'), update: change('update'), remove: change('remove') };
