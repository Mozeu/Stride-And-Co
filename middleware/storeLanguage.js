const { URLSearchParams } = require('node:url');

function storeLanguage(req, res, next) {
  const locale = req.getLocale();
  if (req.query.lang === 'es' || req.query.lang === 'en') {
    res.cookie('lang', locale, {
      httpOnly: true, sameSite: 'lax', secure: req.secure || req.app.get('env') === 'production'
    });
  }

  const query = new URLSearchParams(req.originalUrl.split('?').slice(1).join('?'));
  res.locals.languageLinks = ['es', 'en'].map(lang => {
    query.set('lang', lang);
    return { lang, url: req.baseUrl + req.path + '?' + query.toString() };
  });
  return next();
}

module.exports = storeLanguage;
