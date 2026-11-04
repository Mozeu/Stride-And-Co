const mongoose = require('mongoose');
const config = require('config');

function connectMongo() {
  return mongoose.connect(config.get('mongo.uri'));
}

module.exports = connectMongo;