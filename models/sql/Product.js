const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Product = sequelize.define('Product', {
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { isInt: true }
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 150] }
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { len: [0, 100] }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;