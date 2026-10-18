require('dotenv').config();

const bcrypt = require('bcrypt');

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);

async function hashPassword(password) {
    const saltKey = await bcrypt.genSalt(saltRounds);
    const securePassword = await bcrypt.hash(password, saltKey);
    return { securePassword, saltKey };
}

function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };