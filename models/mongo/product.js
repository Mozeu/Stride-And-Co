// La colección MongoDB de productos es solo una referencia opcional.
// El catálogo activo se almacena en PostgreSQL mediante models/sql/Product.js.
//
// const mongoose = require('mongoose');
//
// const productSchema = new mongoose.Schema({
//   name: { type: String, required: true, trim: true },
//   description: { type: String, trim: true },
//   brand: { type: String, trim: true },
//   price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
//   active: { type: Boolean, default: true }
// }, {
//   timestamps: true
// });
//
// module.exports = mongoose.model('Product', productSchema);
