const bcrypt = require('bcrypt');
const config = require('config');

const saltRounds = config.get('bcrypt.saltRounds');

if (
  !Number.isInteger(saltRounds) ||
  saltRounds < 4 ||
  saltRounds > 31
) {
  throw new Error('bcrypt.saltRounds debe ser un entero entre 4 y 31');
}

async function hashPassword(password) {
  const saltKey = await bcrypt.genSalt(saltRounds);
  const securePassword = await bcrypt.hash(password, saltKey);

  return { securePassword, saltKey };
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };