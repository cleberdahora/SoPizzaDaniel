'use strict';

module.exports = function(app, server) {
  // Set application variables
  app.set('trust proxy', true); // Enable reverse proxy support
  app.set('ip'         , process.env.IP         || '127.0.0.1');
  app.set('port'       , process.env.PORT       || 3000);
};
