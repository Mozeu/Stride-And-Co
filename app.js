
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const authenticate = require('./middleware/authenticate');
const i18n = require('./config/i18n');

//Router
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var rolesRouter = require('./routes/roles');
var permissionsRouter = require('./routes/permissions');
var productsRouter = require('./routes/products');
var variantsRouter = require('./routes/variants');
var inventoryRouter = require('./routes/inventory');
var customersRouter = require('./routes/customers');
var ordersRouter = require('./routes/orders');
var authRouter = require('./routes/auth');


var app = express();

app.use(i18n.init);
app.use(authenticate);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Routes
app.use('/', indexRouter);
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

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
