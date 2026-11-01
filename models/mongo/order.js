const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesPersonId: Number,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'other']
  },
  totals: {
    subtotal: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    shipping: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    discount: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    total: { type: mongoose.Schema.Types.Decimal128, default: 0 }
  },
  shippingAddress: {
    street: String,
    number: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  items: [{
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 }
  }],
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      required: true
    },
    changedById: Number,
    changedAt: { type: Date, default: Date.now },
    note: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);