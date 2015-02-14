'use strict';

var moment       = require('moment');
var async        = require('async');
var path         = require('path');
var lodash       = require('lodash');
var requireAll   = require('require-all');
var mongoose     = require('mongoose');
var providersDir = path.resolve(__dirname, 'providers');

var providers    = requireAll({
  dirname: providersDir,
  filter : /^(?!base\.js)(.+)\.js?$/, // all except base.js/base.json
  resolve: function(Provider) {
    return new Provider();
  }
});

var Place = mongoose.model('Place');

/**
 * Find places based on a search query near a geographic position
 * @param {array} location - Geographic coordinates as GeoJSON object of
 * Point type
 * @param {function} callback - Callback called on success
 */
function find(options, callback) {
  if (!options.location && !options.providerName) {
    return callback('location or providerName parameters are required!');
  }

  // Wrap a provider to be called by async library
  function wrap(fn) {
    return function(callback) {
      fn(options.location, callback);
    };
  }

  var providersFind = lodash.values(providers)
    .map(lodash.property('find')); // Use find method of providers

  if (options.providerName) {
    // NOTE: In theory, the provider names should be unique, so there is no
    // chance of two providers passing the filter
    providersFind = providersFind.filter(function(provider) {
      return provider.providerName === options.providerName;
    });
  }

  // Search on all providers in parallel and then join all results
  async.parallel(providersFind.map(wrap), function(err, results) {
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

    if (!place.expiresOn || place.expiresOn > moment().toDate()) {
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
