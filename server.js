'use strict';

// Module dependencies
var http       = require('http');
var express    = require('express');
var configure  = require('./config');
var app        = express();              // Instantiate Express framework
var server     = http.createServer(app); // Create HTTP server

// Set and normalize global and process variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
global.env           = process.env.NODE_ENV;
global.root          = __dirname;
global.app           = app;

// Configure application
configure(app, server);

// Start listening
server.listen(app.get('port'), app.get('ip'), function() {
  console.log('Express server listening on http://%s:%s',
              app.get('ip'), app.get('port'));
});
