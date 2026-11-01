const sequelize = require('../../config/sequelize');
const User = require('./User');
const Role = require('./Roles');
const Permission = require('./Permissions');
const Product = require('./Product');
const Variant = require('./Variant');
const Inventory = require('./Inventory');


Role.hasMany(User, {foreignKey: 'role_id',as: 'users'});

User.belongsTo(Role, {foreignKey: 'role_id', as: 'role'});

Role.belongsToMany(Permission, {
    through: 'role_permissions', //Tabla intermedia
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
    timestamps: false
});

Permission.belongsToMany(Role,{
    through: 'role_permissions', //Tabla intermedia
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
    timestamps: false
});

Product.hasMany(Variant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
Variant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Variant.hasOne(Inventory, { foreignKey: 'variant_id', as: 'inventory', onDelete: 'CASCADE' });
Inventory.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

module.exports = { sequelize, User, Role, Permission, Product, Variant, Inventory };