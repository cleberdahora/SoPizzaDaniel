'use strict';

// Configuration modules
var modules = [ ];

module.exports = function(app, server) {
  // Configure other modules
  modules
    .filter(function (module) { return !!module.configure; })
    .forEach(function (module) { return module.configure(app, server); });
};
