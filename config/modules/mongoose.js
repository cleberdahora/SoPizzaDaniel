'use strict';

var mongoose = require('mongoose');

function mongooseConfig(app, server) {
  var uri = app.get('DB_URI');
  mongoose.connect(uri);
}

module.exports = {
  configure: mongooseConfig
};
