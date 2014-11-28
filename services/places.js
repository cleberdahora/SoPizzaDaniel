'use strict';

var moment       = require('moment');
var async        = require('async');
var path         = require('path');
var lodash       = require('lodash');
var requireAll   = require('require-all');
var mongoose     = require('mongoose');
var providersDir = path.resolve('./services/places-providers');
var providers    = requireAll(providersDir);

var Place = mongoose.model('Place');

/**
 * Find places based on a search query near a geographic position
 * @param {array} coordinates - Geographic coordinates as [lng, lat]
 * @param {function} callback - Callback called on success
 */
function find(coordinates, callback) {
  // Wrap a provider to be called by async library
  function wrap(fn) {
    return function(callback) {
      fn(coordinates, callback);
    };
  }

  var providersFind = lodash.values(providers)
    .map(lodash.property('find')) // Use find method of providers
    .map(wrap);                   // Wrap methods to be used by async

  // Search on all providers in parallel and then join all results
  async.parallel(providersFind, function(err, results) {
    callback(err, lodash.flatten(results));
  });
}

/**
 * Find a single place based on ID
 * @param {string} id - place ID
 * @param {function} callback - Callback called on success
 */
function findOne(id, callback) {
  Place.findById(id, function(err, place) {
    if (err) {
      return callback(err, null);
    }

    if (!place) {
      return callback(null, null);
    }

    if (place.expiresOn > moment().toDate()) {
      callback(null, place);
    } else {
      var providerName = place.providerInfo.provider;
      var provider     = providers[providerName];

      provider.updatePlace(place, callback);
    }
  });
}

var places = {
  find   : find,
  findOne: findOne
};

module.exports = places;
