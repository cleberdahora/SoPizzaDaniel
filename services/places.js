'use strict';

let async        = require('async');
let path         = require('path');
let lodash       = require('lodash');
let requireAll   = require('require-all');
let providersDir = path.resolve('./services/places-providers');
let providers    = requireAll(providersDir);

/**
 * Find places based on a search query near a geographic position
 * @param {string} query - Search query
 * @param {string} location - Geographic position to use for proximity
 * @param {function} callback - Callback called on success
 */
function find(location, callback) {
  // Wrap a provider to be called by async library
  function wrap(provider) {
    return function(asyncCallback) {
      provider(location, asyncCallback);
    };
  }

  let providersFind = lodash.values(providers)
    .map(lodash.property('find')) // Use find method of providers
    .map(wrap);                   // Wrap methods to be used by async

  // Search on all providers in parallel and then join all results
  async.parallel(providersFind, function(err, results) {
    callback(err, lodash.flatten(results));
  });
}

let places = {
  find: find
};

module.exports = places;
