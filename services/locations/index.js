'use strict';

var path         = require('path');
var lodash       = require('lodash');
var async        = require('async');
var requireAll   = require('require-all');
var providersDir = path.resolve(__dirname, 'providers');

var providers    = requireAll({
  dirname: providersDir,
  filter : /^(?!base\.js)(.+)\.js?$/, // all except base.js/base.json
  resolve: function(Provider) {
    return new Provider();
  }
});

/**
 * Search locations based on a query and receives back detailed information
 * of matching locations
 * @param {string} query - Query used to find all the related locations
 * @param {function} callback - Callback called on completion
 */
function search(query, options, callback) {
  if (lodash.isFunction(options)) {
    callback = options;
    options = {};
  }

  var searchers = lodash.values(providers)
    .filter(function(provider) {
      // Filter only providers that can handle the query
      return provider.isKnown(query);
    })
    .map(lodash.property('search'));

  if (searchers.length) {
    // Search on all providers the locations for the specified query
    async.parallel(searchers.map(function(searchFn) {
      return lodash.partial(searchFn, query);
    }), function(err, results) {
      if (err) {
        return callback('No providers found for the searched term.');
      }

      callback(null, lodash.flatten(results));
    });
  } else {
    return callback('No providers found for the searched term.');
  }
}

var locationService = {
  search: search
};

module.exports = locationService;
