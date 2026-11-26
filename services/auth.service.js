// Separar logica de controllers/auth.js a un servicio para poder reutilizar y compartirlo

const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models/sql');
const { verifyPassword } = require('../utils/password');
const jwtConfig = require('../config/jwt');

function signToken(user) {
    return jwt.sign(
        { sub: String(user.id) },
        jwtConfig.secret,
        {
            expiresIn: jwtConfig.expiresIn,
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
            algorithm: 'HS256'
        }
    );
}

// Payload, or null si el token es invalido o expirado
function verifyToken(token) {
    try {
        return jwt.verify(token, jwtConfig.secret, {
            algorithms: ['HS256'],
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        });
    } catch {
        return null;
    }
}

// User si email y contraseña son validos y el useruario esta activo, else null
async function checkCredentials(email, password) {
    const user = await User.findOne({ where: { email: email.trim() } });
    if (!user || !user.active) return null;

    const valid = await verifyPassword(password, user.password_hash);
    return valid ? user : null;
}

// User sin role o permisos, sin password_hash or salt_key
function findSessionUser(id) {
    return User.findByPk(id, {
        attributes: { exclude: ['password_hash', 'salt_key'] },
        include: [{
            model: Role,
            as: 'role',
            include: [{ model: Permission, as: 'permissions', attributes: ['id', 'key'] }]
        }]
    });
}

module.exports = { signToken, verifyToken, checkCredentials, findSessionUser };
