const mongoose = require('mongoose');

// Conexion a MongoDB a partir de Mongoose
function connectMongo() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/stride_co";
  return mongoose.connect(uri);
}

module.exports = connectMongo;