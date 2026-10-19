const { User, Role, Permission } = require('../models/relationals');
const { expressjwt } = require('express-jwt');
const jwtConfig = require('../config/jwt');

const verifyToken = expressjwt({
    secret: jwtConfig.secret,
    algorithms: ['HS256'],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
});

function authenticate(req, res, next) {
    if (req.path === '/api/auth/login') return next();

    verifyToken(req, res, async (error) => {
        if (error) return next(error);
        if (!req.path.startsWith('/api/')) return next();

        try {
            const user = await User.findByPk(req.auth.sub, {
                attributes: { exclude: ['password_hash', 'salt_key'] },
                include: [{
                    model: Role,
                    as: 'role',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        attributes: ['id', 'key']
                    }]
                }]
            });

            if (!user || !user.active) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            req.user = user;
            return next();
        } catch (queryError) {
            return next(queryError);
        }
    });
}

module.exports = authenticate;