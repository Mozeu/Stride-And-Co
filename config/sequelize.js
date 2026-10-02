const { Sequelize } = require('sequelize');

// Conexion a MySQL
const sequelize = new Sequelize(
  // Nombre de la base de datos
  'stride_co',
  // Usuario de la base de datos
  'root',
  // Password de la base de datos
  'abcd1234',
  {
    // host: define la direccion del servidor de la base de datos
    host: 'localhost',
    // port: el puerto en el que atiende nuestro servidor de base de datos
    port: 3306,
    // dialect: la base de datos específica que vamos a usar
    dialect: 'mysql',
    logging: false,
    define: {
      // Convierte automáticamente los campos de los modelos de camelCase a snake_case (createdAt -> created_at, roleId -> role_id)
      underscored: true
    }
  }
);

module.exports = sequelize;