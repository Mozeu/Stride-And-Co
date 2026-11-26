
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { createHmac } = require('node:crypto');
const { secret } = require('./config/jwt');
const logger = require('morgan');
const authenticate = require('./middleware/authenticate');
const i18n = require('./config/i18n');

//Router
const indexRouter = require('./routes/api/index');
const usersRouter = require('./routes/api/users');
const rolesRouter = require('./routes/api/roles');
const permissionsRouter = require('./routes/api/permissions');
const productsRouter = require('./routes/api/products');
const variantsRouter = require('./routes/api/variants');
const inventoryRouter = require('./routes/api/inventory');
const customersRouter = require('./routes/api/customers');
const ordersRouter = require('./routes/api/orders');
const authRouter = require('./routes/api/auth');
const indexWebRouter = require('./routes/web/index');

const { loadSession, requireLogin } = require('./middleware/session');
const { readFlash } = require('./middleware/flash');
const authWebRouter = require('./routes/web/auth');
const myOrdersWebRouter = require('./routes/web/my-orders');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const cartCookieSecret = createHmac('sha256', secret).update('stride-cart-cookie').digest('hex');
app.use(cookieParser(cartCookieSecret));
app.use(express.static(path.join(__dirname, 'public')));

app.use(i18n.init);
app.use(authenticate);
app.use(loadSession); // reads cookie
app.use(readFlash);

//Routes
app.use('/', authWebRouter);
app.use('/', myOrdersWebRouter);
app.use('/', indexWebRouter);
app.use('/health', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  if (!err.status) {
    const isSequelizeValidation =
      err.name === 'SequelizeValidationError' ||
      err.name === 'SequelizeUniqueConstraintError' ||
      err.name === 'SequelizeForeignKeyConstraintError';

    // 22P02 = invalid input syntax in PostgreSQL (e.g. id "abc")
    const isBadInput =
      err.name === 'SequelizeDatabaseError' &&
      err.parent &&
      err.parent.code === '22P02';

    // MongoDB (customers and orders)
    const isMongoose = err.name === 'ValidationError' || err.name === 'CastError';

    if (isSequelizeValidation || isBadInput || isMongoose) {
      err.status = 400;
    }
  }
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: req.__("authenticate.Unauthorized") });
  }

  const status = err.status || 500;
  const locale = req.getLocale();
  const isDevelopment = req.app.get('env') === 'development';

  res.locals.message = err.message;
  res.locals.error = isDevelopment ? err : {};
  res.locals.status = status;

  res.status(status);

  if (status === 404) {
    return res.render('errors/404', {
      title: req.__('webErrors.notFoundTitle'),
      locale
    });
  }

  if (status >= 500) {
    return res.render('errors/500', {
      title: req.__('webErrors.serverErrorTitle'),
      locale,
      error: isDevelopment ? err : {}
    });
  }

  return res.render('error', {
    title: req.__('webErrors.genericTitle'),
    locale
  });
});

module.exports = app;
