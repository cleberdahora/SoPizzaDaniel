'use strict';

var BaseProvider = require('./base.js');
var mongoose     = require('mongoose');

var Place = mongoose.model('Place');

function LocalProvider() {

  function find(coordinates, callback) {
    Place.geoNear(coordinates, {
      maxDistance: 50000,
      spherical: true,
      query: { providerInfo: null }
    }, function(err, results, stats) {
      callback(err, results);
    });
  }

  this.find = find;
}

LocalProvider.prototype = new BaseProvider('local');

module.exports = LocalProvider;
