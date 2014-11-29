'use strict';

module.exports = function(app, server) {
  // Set application variables
  app.enable('trust proxy'); // Enable reverse proxy support
  app.set('ip'    , process.env.IP || '127.0.0.1');
  app.set('port'  , process.env.PORT);
  app.set('db-uri', process.env.MONGOHQ_URL);
};
