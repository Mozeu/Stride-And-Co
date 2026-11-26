const ordersService = require('../../services/orders.service');

const statuses = new Set(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']);
const methods = new Set(['cash', 'card', 'transfer', 'other']);

function viewHelpers(req) {
  const locale = req.getLocale();
  const displayLocale = locale === 'en' ? 'en-MX' : 'es-MX';
  const money = new Intl.NumberFormat(displayLocale, { style: 'currency', currency: 'MXN' });
  const date = new Intl.DateTimeFormat(displayLocale, { dateStyle: 'medium', timeZone: 'UTC' });
  return {
    locale,
    money: value => value == null ? '—' : money.format(value.toString()),
    date: value => value ? date.format(value) : '—',
    statusLabel: status => req.__('store.orders.status.' + (statuses.has(status) ? status : 'unknown')),
    paymentLabel: method => req.__('store.orders.payment.' + (methods.has(method) ? method : 'other'))
  };
}

function currentStatus(order) {
  return order.statusHistory?.at(-1)?.status || 'pending';
}

async function list(req, res, next) {
  try {
    const orders = await ordersService.listForUser(req.user.id);
    return res.render('orders/mine', {
      ...viewHelpers(req),
      title: req.__('store.orders.title') + ' | Stride & Co',
      metaDescription: req.__('store.orders.description'),
      orders,
      currentStatus
    });
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const order = await ordersService.findForUser(req.user.id, req.params.id);
    const address = order.shippingAddress || {};
    return res.render('orders/detail', {
      ...viewHelpers(req),
      title: req.__('store.orders.detailTitle') + ' | Stride & Co',
      metaDescription: req.__('store.orders.detailDescription'),
      order,
      currentStatus,
      address: [address.street, address.number, address.city, address.state, address.postalCode, address.country]
        .filter(Boolean).join(', ')
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, detail };
