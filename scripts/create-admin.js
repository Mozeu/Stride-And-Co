require('dotenv').config();
const { sequelize, User, Role } = require('../models/relationals');
const { hashPassword } = require('../utils/password');

async function createAdmin() {
    await sequelize.sync();

    const role = await Role.findOne({ where: { name: 'admin' } });
    if (!role) {
        console.log('necesitas correr "node scripts/seed-rbac.js" primero.');
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
    console.log('admin -> user id ' + user.id);
    await sequelize.close();
}

createAdmin().catch((error) => {
    console.error(error);
    process.exit(1);
});