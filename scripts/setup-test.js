const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const projectRoot = path.resolve(__dirname, '..');
const configDir = path.join(projectRoot, 'config');
const configPath = path.join(configDir, 'local-test.json');
const defaultsPath = path.join(configDir, 'test.json');
const container = process.env.POSTGRES_CONTAINER || 'stride-postgres';
const adminUser = process.env.POSTGRES_ADMIN_USER || 'root';

function quoteIdentifier(identifier, label) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(identifier)) {
    throw new Error(`Identificador de ${label} no válido: ${identifier}`);
  }
  return `"${identifier}"`;
}

function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function runPsql(database, sql, options = {}) {
  const result = spawnSync('docker', [
    'exec',
    '-i',
    container,
    'psql',
    '-X',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    adminUser,
    '-d',
    database,
    '-A',
    '-t'
  ], {
    input: sql,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024
  });

  if (result.error) {
    throw new Error(`No se pudo ejecutar Docker: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = result.stderr.trim() || `psql terminó con código ${result.status}`;
    throw new Error(`Falló la configuración de PostgreSQL: ${detail}`);
  }

  return options.output ? result.stdout.trim() : undefined;
}

function writeConfigAtomically(config) {
  const temporaryPath = path.join(configDir, `.local-test.${process.pid}.tmp`);
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, {
      mode: 0o600,
      flag: 'wx'
    });
    fs.renameSync(temporaryPath, configPath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    throw error;
  }
}

function restoreConfig(previousConfig) {
  if (!previousConfig) {
    fs.unlinkSync(configPath);
    return;
  }

  const restorePath = path.join(configDir, `.local-test.${process.pid}.restore`);
  try {
    fs.writeFileSync(restorePath, previousConfig, {
      mode: 0o600,
      flag: 'wx'
    });
    fs.renameSync(restorePath, configPath);
  } catch (error) {
    if (fs.existsSync(restorePath)) fs.unlinkSync(restorePath);
    throw error;
  }
}

async function setupTest() {
  const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
  const database = quoteIdentifier(defaults.postgres.database, 'base de datos');
  const appUser = quoteIdentifier(defaults.postgres.user, 'usuario');

  if (!defaults.postgres.database.endsWith('_test') ||
      !defaults.postgres.user.endsWith('_test')) {
    throw new Error('La configuración debe apuntar a una base y usuario de pruebas (*_test).');
  }

  const existingConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {};
  const localConfig = {
    ...existingConfig,
    postgres: {
      ...existingConfig.postgres
    }
  };
  const previousConfig = fs.existsSync(configPath)
    ? fs.readFileSync(configPath)
    : null;
  const password = crypto.randomBytes(32).toString('base64url');
  const interface_ = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    process.stdout.write(
      `Se actualizará el usuario PostgreSQL "${defaults.postgres.user}" ` +
      `para la base "${defaults.postgres.database}" en el contenedor ` +
      `"${container}". La contraseña nueva se guardará en ` +
      'config/local-test.json.\n'
    );
    if (previousConfig) {
      process.stdout.write(
        'El archivo local ya existe: se conservarán sus demás opciones.\n'
      );
    }
    const answer = await interface_.question('¿Continuar? (s/N) ');
    if (!/^s(i)?$/i.test(answer.trim())) {
      process.stdout.write('Configuración cancelada.\n');
      return;
    }

    runPsql('postgres', `
DO $setup$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${quoteLiteral(defaults.postgres.user)}) THEN
    CREATE ROLE ${appUser} WITH LOGIN CREATEDB;
  ELSE
    ALTER ROLE ${appUser} WITH LOGIN CREATEDB;
  END IF;
END
$setup$;
`);

    const databaseExists = runPsql('postgres', `
SELECT 1 FROM pg_database WHERE datname = ${quoteLiteral(defaults.postgres.database)};
`, { output: true });

    if (!databaseExists) {
      runPsql('postgres', `CREATE DATABASE ${database} OWNER ${appUser};\n`);
    }

    runPsql(defaults.postgres.database, `
GRANT CONNECT, CREATE, TEMPORARY ON DATABASE ${database} TO ${appUser};
GRANT USAGE, CREATE ON SCHEMA public TO ${appUser};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${appUser};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${appUser};
`);

    localConfig.postgres.password = password;
    writeConfigAtomically(localConfig);
    try {
      runPsql('postgres', `
ALTER ROLE ${appUser} WITH LOGIN CREATEDB PASSWORD ${quoteLiteral(password)};
`);
    } catch (error) {
      restoreConfig(previousConfig);
      throw error;
    }

    fs.chmodSync(configPath, 0o600);
    process.stdout.write(
      `Listo. Se guardó la configuración en ${path.relative(projectRoot, configPath)} ` +
      'con permisos privados.\n' +
      'Ejecuta `NODE_ENV=test npm run seed` para comprobar la conexión y cargar los datos.\n'
    );
  } finally {
    interface_.close();
  }
}

setupTest().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
