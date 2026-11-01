const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

// Definimos la tabla
const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true, len: [1, 100] }
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { len: [0, 100] }
  }
}, {
  tableName: 'roles',
  timestamps: true // created_at y updated_at
});

module.exports = Role;