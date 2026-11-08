/* global __dirname */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const projectRoot = path.resolve(__dirname, '..');

function runNode(code) {
  return spawnSync(process.execPath, ['-e', code], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '8080'
    },
    encoding: 'utf8'
  });
}

describe('Configuracion por entornos', () => {
  test('carga test.json y convierte PORT a numero', () => {
    const result = runNode(`
      const assert = require('node:assert/strict');
      const config = require('config');

      assert.equal(config.util.getEnv('NODE_ENV'), 'test');
      assert.equal(config.get('server.port'), 8080);
      assert.equal(config.get('postgres.database'), 'stride_co_test');
      assert.equal(config.get('bcrypt.saltRounds'), 4);
    `);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  test('carga el secreto JWT ficticio de pruebas', () => {
    const result = runNode(`
      const assert = require('node:assert/strict');
      const jwt = require('./config/jwt');

      assert.equal(
        jwt.secret,
        'test-only-secret-never-use-in-production'
      );
      assert.equal(jwt.expiresIn, '15m');
    `);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  test('los archivos generales no contienen campos secretos', () => {
    for (const file of [
      'default.json',
      'development.json',
      'production.json'
    ]) {
      const content = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'config', file), 'utf8')
      );

      expect(content.jwt?.secret).toBeUndefined();
      expect(content.postgres?.password).toBeUndefined();
      expect(content.mongo?.uri).toBeUndefined();
    }
  });

  test('rechaza la carga cuando falta jwt.secret', () => {
    jest.resetModules();

    jest.doMock('config', () => ({
      has: () => false
    }));

    try {
      expect(() => {
        jest.isolateModules(() => {
          require('../config/jwt');
        });
      }).toThrow('Falta configurar jwt.secret');
    } finally {
      jest.dontMock('config');
      jest.resetModules();
    }
  });
});