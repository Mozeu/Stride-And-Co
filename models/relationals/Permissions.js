const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Definimos la tabla
const Permission = sequelize.define('Permission', {
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'permissions',
  timestamps: true // created_at y updated_at
});

module.exports = Permission;