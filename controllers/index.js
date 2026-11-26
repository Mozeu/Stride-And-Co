const {Product} = require('../models/sql');

async function home(req, res, next) {
  try {
    const products = await Product.findAll();
    return res.render('index', {
      title: 'Stride & Co',
      products,
      locale: req.getLocale()
    });
  } catch (error) {
    return next(error);
  }
}

function healthCheck(req, res) {
res.status(200).json({
status: 'UP'
});
}

module.exports = {
    home,healthCheck
}