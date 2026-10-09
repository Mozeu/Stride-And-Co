const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  totals: {
    subtotal: Number,
    shipping: Number,
    discount: Number
    // faltan más campos, se completa después
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);