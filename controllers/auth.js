const {User} = require('../models/relationals');
const { verifyPassword } = require('../utils/password');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const INVALID_CREDENTIALS = { message: 'Invalid credentials' };

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

function me(req, res) {
    const user = req.user;

    return res.json({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
        active: user.active
    });
}



async function login(req, res, next) {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== 'string' || !password.trim()) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ where: { email: email.trim() } });

        if (!user || !user.active) {
            return res.status(401).json(INVALID_CREDENTIALS);
        }

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return res.status(401).json(INVALID_CREDENTIALS);

        return res.json({
            message: 'Login successful',
            data: {
                token: signToken(user),
                tokenType: 'Bearer',
                expiresIn: jwtConfig.expiresIn
            }
        });
    } catch (error) {
        return next(error);
    }
}


module.exports = { login, me };