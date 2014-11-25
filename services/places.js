'use strict';

var async        = require('async');
var path         = require('path');
var lodash       = require('lodash');
var requireAll   = require('require-all');
var providersDir = path.resolve('./services/places-providers');
var providers    = requireAll(providersDir);

/**
 * Find places based on a search query near a geographic position
 * @param {string} query - Search query
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

var places = {
  find: find
};

module.exports = places;
