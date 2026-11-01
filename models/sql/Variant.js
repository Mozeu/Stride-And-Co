const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Variant = sequelize.define('Variant', {
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, isInt: true }
  },
  size: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 20] }
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 30] }
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true, len: [1, 100] }
  },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'product_variants',
  timestamps: true
});

module.exports = Variant;