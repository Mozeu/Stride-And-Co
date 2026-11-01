const { log } = require('node:console');
require('dotenv').config();
const { sequelize, User, Role } = require('../models/sql');
const { hashPassword } = require('../utils/password');

async function createAdmin() {
    await sequelize.sync();

    const role = await Role.findOne({ where: { name: 'admin' } });
    if (!role) {
        log('necesitas correr "node scripts/seed-rbac.js" primero.');
        await sequelize.close();
        return;
    }

    const passwordData = await hashPassword('abcd1234');
    const [user] = await User.findOrCreate({
        where: { email: 'admin@stride.test' },
        defaults: {
            first_name: 'admin',
            last_name: 'Test',
            active: true,
            role_id: role.id,
            password_hash: passwordData.securePassword,
            salt_key: passwordData.saltKey
        }
    });
    log('admin -> user id ' + user.id);
    await sequelize.close();
}

createAdmin().catch((error) => {
    process.stderr.write(`${error}\n`);
    process.exit(1);
});