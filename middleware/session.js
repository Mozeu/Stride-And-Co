const authService = require('../services/auth.service');

function isApiPath(path) {
    return path === '/api' || path.startsWith('/api/');
}

// Corre con un request y llena req.user y res.locals.user
async function loadSession(req, res, next) {
    res.locals.user = null;

    if (isApiPath(req.path)) return next();

    const token = req.cookies && req.cookies.access_token;
    if (!token) return next();

    try {
        const payload = authService.verifyToken(token);
        const user = payload ? await authService.findSessionUser(payload.sub) : null;

        if (!user || !user.active) {
            res.clearCookie('access_token');
            return next();
        }

        req.user = user;
        res.locals.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
}

// Para rotas protegidas : sin session -> /login, pero recordando a donde queria ir el usuario
function requireLogin(req, res, next) {
    if (res.locals.user) return next();
    return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl));
}

module.exports = { loadSession, requireLogin };
