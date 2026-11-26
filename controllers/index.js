const {Product} = require('../models/sql');

async function home (req, res, next) {
  const products = await Product.findAll();
  res.render('index', { title: 'Stride & Co', products: products });
}

function healthCheck(req, res) {
res.status(200).json({
status: 'UP'
});
}

module.exports = {
    home,healthCheck
}