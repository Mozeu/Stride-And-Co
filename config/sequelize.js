const { Sequelize } = require('sequelize');
const config = require('config');

const postgres = config.get('postgres');

const sequelize = new Sequelize(
  postgres.database,
  postgres.user,
  config.get('postgres.password'),
  {
    host: postgres.host,
    port: postgres.port,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true
    },
    dialectOptions: postgres.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: true
          }
        }
      : {}
  }
);

module.exports = sequelize;