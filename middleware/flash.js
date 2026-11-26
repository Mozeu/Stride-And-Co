const FLASH_COOKIE = 'flash';

// key = translation key, ('auth.LoginSuccessful' = 'success' or 'error')
function setFlash(res, type, key) {
    res.cookie(FLASH_COOKIE, JSON.stringify({ type, key }), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 1000
    });
}

function readFlash(req, res, next) {
    res.locals.flash = null;

    const raw = req.cookies && req.cookies[FLASH_COOKIE];
    if (!raw) return next();

    res.clearCookie(FLASH_COOKIE); // solo una vez

    try {
        const { type, key } = JSON.parse(raw);
        if (['success', 'error'].includes(type) && /^[A-Za-z0-9_.]+$/.test(key)) {
            res.locals.flash = { type, message: req.__(key) };
        }
    } catch {
        // cookies malformadas se ignoran
    }
    return next();
}

module.exports = { setFlash, readFlash };
