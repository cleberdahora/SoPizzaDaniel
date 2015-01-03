'use strict';

module.exports = function(app, server) {
  // Set application variables
  app.enable('trust proxy'); // Enable reverse proxy support
  app.set('ip'    , process.env.IP || '0.0.0.0');
  app.set('port'  , process.env.PORT);
  app.set('db-uri', process.env.DB_URI || process.env.MONGOHQ_URL);

  app.set('key-google-places', process.env.KEY_GOOGLE_PLACES);
};
