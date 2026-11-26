const { expressjwt } = require('express-jwt');
const jwtConfig = require('../config/jwt');
const { findSessionUser } = require('../services/auth.service');

const verifyToken = expressjwt({
    secret: jwtConfig.secret,
    algorithms: ['HS256'],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    // primero lee API clients, segundo el cookie del browser. Tests funcionan hasta sin cookieParser
    getToken: (req) => req.headers.authorization?.replace(/^Bearer /, '')
        || req.cookies?.access_token
});

function authenticate(req, res, next) {
    const isApiRequest = req.path === '/api' || req.path.startsWith('/api/');
    const isLoginRequest = req.method === 'POST' && req.path === '/api/auth/login';

    if (!isApiRequest || isLoginRequest) return next();

    verifyToken(req, res, async (error) => {
        if (error) return next(error);

        try {
            const user = await findSessionUser(req.auth.sub);

            if (!user || !user.active) {
                return res.status(401).json({ message: req.__("authenticate.Unauthorized") });
            }

            req.user = user;
            return next();
        } catch (queryError) {
            return next(queryError);
        }
    });
}

module.exports = authenticate;
