const config = require('config');

if (!config.has('jwt.secret')) {
  throw new Error('Falta configurar jwt.secret en el archivo local del entorno');
}

const secret = config.get('jwt.secret');

if (
  typeof secret !== 'string' ||
  !secret.trim() ||
  secret === 'REEMPLAZAR'
) {
  throw new Error('jwt.secret debe contener un secreto valido');
}

module.exports = {
  secret,
  expiresIn: config.get('jwt.expiresIn'),
  issuer: config.get('jwt.issuer'),
  audience: config.get('jwt.audience')
};