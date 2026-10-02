const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Definimos la tabla
const User = sequelize.define('User', {
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
  // faltan atributos que añadiremos luego
}, {
  tableName: 'users',
  timestamps: true // created_at y updated_at
});

module.exports = User;