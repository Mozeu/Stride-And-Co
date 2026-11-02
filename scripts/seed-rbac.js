const { log } = require('node:console');
require('dotenv').config();
const { sequelize, Role, Permission } = require('../models/sql');

// Matriz RBAC: rol -> permisos
// Formato: recurso:acción:alcance

const matrix = {
    admin: [
        'users:create:any', 'users:read:any', 'users:update:any', 'users:delete:any',
        'users:create:own', 'users:read:own', 'users:update:own', 'users:delete:own',
        'roles:create:any', 'roles:read:any', 'roles:update:any', 'roles:delete:any',
        'permissions:create:any', 'permissions:read:any', 'permissions:update:any', 'permissions:delete:any',
        'products:create:any', 'products:read:any', 'products:update:any', 'products:delete:any',
        'variants:create:any', 'variants:read:any', 'variants:update:any', 'variants:delete:any',
        'inventory:read:any', 'inventory:update:any',
        'customers:create:any', 'customers:read:any', 'customers:update:any', 'customers:delete:any',
        'orders:create:any', 'orders:read:any', 'orders:update:any',
        'orders:read:own', 'orders:update:own'
    ],
    sales: [
        'users:read:any',
        'users:create:own', 'users:read:own', 'users:update:own', 'users:delete:own',
        'products:read:any',
        'variants:read:any',
        'inventory:read:any', 'inventory:update:any',
        'customers:create:any', 'customers:read:any', 'customers:update:any',
        'orders:create:any', 'orders:read:any', 'orders:update:any',
        'orders:read:own', 'orders:update:own'
    ],
    user: [
        'users:create:own', 'users:read:own', 'users:update:own',
        'products:read:any',
        'variants:read:any',
        'customers:read:own', 'customers:update:own',
        'orders:create:own', 'orders:read:own', 'orders:update:own'
    ]
};

async function seed({ closeConnection = true } = {}) {
    try {
        await sequelize.sync();

        const keys = [...new Set(Object.values(matrix).flat())];
        const permissions = {};
        for (const key of keys) {
            const [permission] = await Permission.findOrCreate({
                where: { key },
                defaults: { description: key }
            });
            permissions[key] = permission;
        }

        for (const roleName of Object.keys(matrix)) {
            const [role] = await Role.findOrCreate({
                where: { name: roleName },
                defaults: { description: 'Rol ' + roleName }
            });
            await role.setPermissions(matrix[roleName].map((key) => permissions[key]));
            log(roleName + ' -> ' + matrix[roleName].length + ' permisos');
        }
    } finally {
        if (closeConnection) await sequelize.close();
    }
}

if (require.main === module) {
    seed().catch((error) => {
        process.stderr.write(`${error}\n`);
        process.exitCode = 1;
    });
}

module.exports = { seed, matrix };