'use strict';

// Module dependencies
var path = require('path');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var enrouten = require('express-enrouten');
var morgan = require('morgan');

function mapPath(relativePath) {
  return path.join(global.root, relativePath);
}

function registerMiddlewares(app) {
  // Middleware pre-configurations
  express.static.mime.define({
    'text/cache-manifest': ['appcache']
  });

  // General
  app.use(compression());
  app.use(bodyParser.json());
  app.use(morgan('dev')); // logger

  // API
  app.use('/api', enrouten({
    directory: mapPath('api')
  }));
}

module.exports = registerMiddlewares;
