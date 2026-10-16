const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Definimos la tabla
const User = sequelize.define('User', {
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  password_hash: { type: DataTypes.STRING(100), allowNull: false },
  salt_key: { type: DataTypes.STRING(100), allowNull: false }
  // faltan atributos que añadiremos luego
}, {
  tableName: 'users',
  timestamps: true // created_at y updated_at
});

User.prototype.toJSON = function () {
  const values = {...this.get()};
  delete values.password_hash;
  delete values.salt_key;
  return values;
};

module.exports = User;