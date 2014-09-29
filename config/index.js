'use strict';

module.exports = function(app, server) {
  // Load configuration modules
  var configModules     = require('./modules');
  var configSettings    = require('./settings');
  var configMiddlewares = require('./middlewares');

  // Configure application
  configSettings(app, server); // NOTE: settings can be overridden by modules
  configModules(app, server);
  configMiddlewares(app);
};
