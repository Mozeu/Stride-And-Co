require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'stride_co',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'abcd1234',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      underscored: true
    }
  }
);

module.exports = sequelize;