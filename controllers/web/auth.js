const authService = require('../../services/auth.service');
const { setFlash } = require('../../middleware/flash');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' // Render
};

// Solo /login?returnTo=https://evil.com no puede redirigir hacia afuera
function safeReturnTo(value) {
    if (typeof value !== 'string') return '/';
    if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
    if (value.startsWith('/login')) return '/';
    return value;
}

function renderLogin(req, res, status, { email = '', errors = {}, formError = null } = {}) {
    const source = req.method === 'POST' ? req.body : req.query;

    return res.status(status).render('auth/login', {
        title: req.__('auth.login.pageTitle'),
        metaDescription: req.__('auth.login.metaDescription'),
        locale: req.getLocale(),
        email,
        errors,
        formError,
        returnTo: safeReturnTo(source && source.returnTo)
    });
}

function showLogin(req, res) {
    if (res.locals.user) return res.redirect(safeReturnTo(req.query.returnTo));
    return renderLogin(req, res, 200);
}

async function login(req, res, next) {
    const { email, password } = req.body || {};
    const errors = {};

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        errors.email = req.__('auth.login.errors.email');
    }
    if (typeof password !== 'string' || !password.trim()) {
        errors.password = req.__('auth.login.errors.password');
    }

    const emailValue = typeof email === 'string' ? email.trim() : '';

    if (Object.keys(errors).length > 0) {
        return renderLogin(req, res, 400, { email: emailValue, errors });
    }

    try {
        const user = await authService.checkCredentials(email, password);

        if (!user) {
            return renderLogin(req, res, 401, {
                email: emailValue,
                formError: req.__('auth.invalidCredentials')
            });
        }

        res.cookie('access_token', authService.signToken(user), COOKIE_OPTIONS);
        setFlash(res, 'success', 'auth.LoginSuccessful');
        return res.redirect(safeReturnTo(req.body.returnTo));
    } catch (error) {
        return next(error);
    }
}

function logout(req, res) {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    setFlash(res, 'success', 'auth.LogoutSuccessful');
    return res.redirect('/');
}

module.exports = { showLogin, login, logout };
