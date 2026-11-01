const { log } = require('node:console');
require('dotenv').config();
const mongoose = require('mongoose');
const {
  sequelize,
  User,
  Role,
  Product,
  Variant,
  Inventory
} = require('../models/sql');
const { Customer, Order } = require('../models/mongo');
const { hashPassword } = require('../utils/password');
const connectMongo = require('../config/mongoose');
const { seed: seedRbac } = require('./seed-rbac');

const demoUsers = [
  { role: 'admin', email: 'admin@stride.test', password: 'DemoAdmin!2026' },
  { role: 'sales', email: 'sales@stride.test', password: 'DemoSales!2026' },
  { role: 'user', email: 'user@stride.test', password: 'DemoUser!2026' }
];

async function seed() {
  let mongoConnected = false;

  try {
    await seedRbac({ closeConnection: false });

    const users = {};
    for (const demoUser of demoUsers) {
      const role = await Role.findOne({ where: { name: demoUser.role } });
      let user = await User.findOne({ where: { email: demoUser.email } });
      const passwordData = await hashPassword(demoUser.password);

      if (!user) {
        user = await User.create({
          first_name: demoUser.role,
          last_name: 'Demo',
          email: demoUser.email,
          active: true,
          role_id: role.id,
          password_hash: passwordData.securePassword,
          salt_key: passwordData.saltKey
        });
      } else {
        await user.update({
          active: true,
          role_id: role.id,
          password_hash: passwordData.securePassword,
          salt_key: passwordData.saltKey
        });
      }

      users[demoUser.role] = user;
    }

    let variant = await Variant.findOne({ where: { sku: 'STRIDE-DEMO-001' } });
    if (!variant) {
      const product = await Product.create({
        name: 'Stride Demo Runner',
        description: 'Producto de demostración',
        brand: 'Stride',
        price: 599
      });
      variant = await Variant.create({
        product_id: product.id,
        size: 'M',
        color: 'Black',
        sku: 'STRIDE-DEMO-001'
      });
    }

    await Inventory.findOrCreate({
      where: { variant_id: variant.id },
      defaults: { stock: 25, reserved: 0 }
    });

    await connectMongo();
    mongoConnected = true;

    let customer = await Customer.findOne({ userId: users.user.id });
    if (!customer) {
      customer = await Customer.create({
        userId: users.user.id,
        email: users.user.email,
        phone: '5550000000',
        addresses: [{
          type: 'shipping',
          street: 'Demo Street',
          number: '1',
          city: 'Chihuahua',
          state: 'Chihuahua',
          postalCode: '31000',
          country: 'Mexico'
        }]
      });
    }

    const existingOrder = await Order.findOne({ customerId: customer._id });
    if (!existingOrder) {
      await Order.create({
        customerId: customer._id,
        salesPersonId: users.sales.id,
        paymentMethod: 'card',
        totals: {
          subtotal: '599.00',
          shipping: '0.00',
          discount: '0.00',
          total: '599.00'
        },
        items: [{
          productId: variant.product_id,
          quantity: 1,
          unitPrice: '599.00'
        }]
      });
    }

    log('Datos de demostración creados o verificados');
  } finally {
    if (mongoConnected) await mongoose.disconnect();
    await sequelize.close();
  }
}

seed().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
