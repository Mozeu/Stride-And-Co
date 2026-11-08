const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const projectRoot = path.resolve(__dirname, '..');
const configDir = path.join(projectRoot, 'config');
const configPath = path.join(configDir, 'local-development.json');
const defaultsPath = path.join(configDir, 'default.json');
const templatePath = path.join(configDir, 'local-development.example.json');
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
  const temporaryPath = path.join(
    configDir,
    `.local-development.${process.pid}.tmp`
  );
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

async function setupLocal() {
  const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  const existingConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {};
  const database = quoteIdentifier(defaults.postgres.database, 'base de datos');
  const appUser = quoteIdentifier(defaults.postgres.user, 'usuario');
  const adminDatabase = 'postgres';
  const localConfig = {
    ...template,
    ...existingConfig,
    postgres: {
      ...template.postgres,
      ...existingConfig.postgres
    },
    mongo: {
      ...template.mongo,
      ...existingConfig.mongo
    },
    jwt: {
      ...template.jwt,
      ...existingConfig.jwt
    }
  };
  const password = crypto.randomBytes(32).toString('base64url');
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const previousConfig = fs.existsSync(configPath)
    ? fs.readFileSync(configPath)
    : null;
  const interface_ = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    process.stdout.write(
      `Se configurará PostgreSQL en el contenedor "${container}" como ` +
      `administrador "${adminUser}". Se creará o actualizará el rol ` +
      `"${defaults.postgres.user}" y se otorgarán permisos en ` +
      `"${defaults.postgres.database}".\n`
    );
    if (previousConfig) {
      process.stdout.write(
        'El archivo local ya existe: se conservará su URI de MongoDB y se ' +
        'reemplazarán la contraseña de PostgreSQL y el secreto JWT.\n'
      );
    }
    const answer = await interface_.question('¿Continuar? (s/N) ');
    if (!/^s(i)?$/i.test(answer.trim())) {
      process.stdout.write('Configuración cancelada.\n');
      return;
    }

    runPsql(adminDatabase, `
DO $setup$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${quoteLiteral(defaults.postgres.user)}) THEN
    CREATE ROLE ${appUser} WITH LOGIN;
  END IF;
END
$setup$;
`);

    const databaseExists = runPsql(adminDatabase, `
SELECT 1 FROM pg_database WHERE datname = ${quoteLiteral(defaults.postgres.database)};
`, { output: true });

    if (!databaseExists) {
      runPsql(adminDatabase, `CREATE DATABASE ${database} OWNER ${appUser};\n`);
    }

    runPsql(defaults.postgres.database, `
GRANT CONNECT, CREATE, TEMPORARY ON DATABASE ${database} TO ${appUser};
GRANT USAGE, CREATE ON SCHEMA public TO ${appUser};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${appUser};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${appUser};
`);

    localConfig.postgres.password = password;
    localConfig.jwt.secret = jwtSecret;
    writeConfigAtomically(localConfig);

    try {
      runPsql(adminDatabase, `
ALTER ROLE ${appUser} WITH LOGIN PASSWORD ${quoteLiteral(password)};
`);
    } catch (error) {
      if (previousConfig) {
        const restorePath = path.join(
          configDir,
          `.local-development.${process.pid}.restore`
        );
        try {
          fs.writeFileSync(restorePath, previousConfig, {
            mode: 0o600,
            flag: 'wx'
          });
          fs.renameSync(restorePath, configPath);
        } catch (restoreError) {
          if (fs.existsSync(restorePath)) fs.unlinkSync(restorePath);
          throw restoreError;
        }
      } else {
        fs.unlinkSync(configPath);
      }
      throw error;
    }

    fs.chmodSync(configPath, 0o600);
    process.stdout.write(
      `Listo. Se guardó la configuración en ${path.relative(projectRoot, configPath)} ` +
      'con permisos privados; se conservó la URI de MongoDB.\n' +
      'Ejecuta `NODE_ENV=development npm run seed` para cargar los datos iniciales.\n'
    );
  } finally {
    interface_.close();
  }
}

setupLocal().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});