const { log } = require('node:console');
require('dotenv').config();
const { sequelize, Role, Permission } = require('../models/sql');

// Matriz RBAC: rol -> permisos
// Formato: recurso:acción:alcance

const matrix = {
    admin: [
        'products:read:any', 
        'products:create:any', 
        'products:update:any', 
        'products:delete:any',
        'orders:create:any', 
        'orders:read:own', 
        'orders:read:any', 
        'orders:update:own', 
        'orders:update:any',
        'users:read:any'
    ],
    sales: [
        'products:read:any',
        'orders:create:any', 
        'orders:read:own', 
        'orders:read:any', 
        'orders:update:own', 
        'orders:update:any'
    ],
    user: [
        'products:read:any',
        'orders:create:any', 
        'orders:read:own', 
        'orders:update:own'
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