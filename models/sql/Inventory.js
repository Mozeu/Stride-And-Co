const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  variant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    validate: { min: 1, isInt: true }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, isInt: true }
  },
  reserved: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, isInt: true }
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  createdAt: false
});

module.exports = Inventory;