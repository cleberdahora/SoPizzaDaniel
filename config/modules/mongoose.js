'use strict';

var path = require('path');
var mongoose = require('mongoose');
var requireAll = require('require-all');

function mongooseConfig(app, server) {
  var uri = app.get('db-uri');
  mongoose.connect(uri);

  // Load all models
  requireAll(path.join(global.root, '/models'));
}

module.exports = {
  configure: mongooseConfig
};
