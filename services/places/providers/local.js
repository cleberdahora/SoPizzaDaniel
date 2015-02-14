'use strict';

var BaseProvider = require('./base.js');
var mongoose     = require('mongoose');
var lodash       = require('lodash');

var Place = mongoose.model('Place');

function LocalProvider() {

  function find(coordinates, callback) {
    Place.geoNear(coordinates, {
      maxDistance: 50000,
      spherical: true,
      query: { providerInfo: null }
    }, function(err, results, stats) {
      var places = lodash.pluck(results, 'obj');
      callback(err, places);
    });
  }

  this.find = find;
}

LocalProvider.prototype = new BaseProvider('local');

module.exports = LocalProvider;
