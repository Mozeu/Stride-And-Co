const { Sequelize } = require('sequelize');
const config = require('config');

const postgresConfig = config.get('postgres');

const sequelize = new Sequelize(
  postgresConfig.database,
  postgresConfig.user,
  postgresConfig.password,
  {
    host: postgresConfig.host,
    port: postgresConfig.port,
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true
    }
  }
);

module.exports = sequelize;