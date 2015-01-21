'use strict';

// Module dependencies
var path = require('path');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var enrouten = require('express-enrouten');
var morgan = require('morgan');
var fs = require('fs');

function mapPath(relativePath) {
  return path.join(global.root, relativePath);
}

function registerMiddlewares(app) {
  var privateRoutes = ['api', 'resources'];
  var expression = '^(?!\/?(' + privateRoutes.join('|') + ')(?![^\/])).*';
  var regex = new RegExp(expression, 'i');

  // Middleware pre-configurations
  express.static.mime.define({
    'text/cache-manifest': ['appcache']
  });

  // General
  app.use(compression());
  app.use(bodyParser.json());
  app.use(morgan('dev')); // logger
  app.use('/resources', express.static(mapPath('public/dist')));
  app.use('/google2717ce23e37314d7.html',
      express.static(mapPath('public/google2717ce23e37314d7.html')));

  // API
  app.use('/api', enrouten({
    directory: mapPath('api')
  }));

  // SPA
  app.get(regex, function(req, res, next) {
    if (req.accepts('html')) {
      res.set('Content-Type', 'text/html');
      res.send(fs.readFileSync(mapPath('public/dist/html/index.html')));
    } else {
      next();
    }
  });
}

module.exports = registerMiddlewares;
