const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Definimos la tabla
const Role = sequelize.define('Role', {
  name: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'roles',
  timestamps: true // created_at y updated_at
});

module.exports = Role;