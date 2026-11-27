const dashboardService = require('../../services/dashboard.service');

const statuses = new Set(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']);

async function dashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboard();
    const locale = req.getLocale();
    const displayLocale = locale === 'en' ? 'en-MX' : 'es-MX';
    const money = new Intl.NumberFormat(displayLocale, { style: 'currency', currency: 'MXN' });
    const date = new Intl.DateTimeFormat(displayLocale, { dateStyle: 'medium', timeZone: 'UTC' });

    return res.render('admin/dashboard', {
      locale,
      title: req.__('admin.dashboard.title') + ' | Stride & Co',
      metaDescription: req.__('admin.dashboard.description'),
      ...data,
      money: value => value == null ? '—' : money.format(value.toString()),
      date: value => value ? date.format(value) : '—',
      currentStatus: order => order.statusHistory?.at(-1)?.status || 'pending',
      statusLabel: status => req.__('store.orders.status.' + (statuses.has(status) ? status : 'unknown'))
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { dashboard };
