const authService = require('../services/auth.service');
const jwtConfig = require('../config/jwt');

//const INVALID_CREDENTIALS = { message: 'Invalid credentials' };

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
        return res.status(400).json({ message: req.__('email.EmailandPassword') });
    }

    try {
        const user = await authService.checkCredentials(email, password);

        if (!user) {
            return res.status(401).json({ message: req.__('auth.invalidCredentials') });
        }

        return res.json({
            message: req.__("auth.LoginSuccessful"),
            data: {
                token: authService.signToken(user),
                tokenType: 'Bearer',
                expiresIn: jwtConfig.expiresIn
            }
        });
    } catch (error) {
        return next(error);
    }
}


module.exports = { login, me };
