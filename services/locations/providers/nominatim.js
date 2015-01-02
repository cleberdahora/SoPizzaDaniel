'use strict';

var request = require('request');
var lodash  = require('lodash');

var BaseProvider = require('./base.js');

function NominatimProvider() {
  function isKnown(query) {
    return true;
  }

  function search(query, options, callback) {
    if (lodash.isFunction(options)) {
      callback = options;
      options = {};
    }

    var qs = {
      q             : query,
      format        : 'json',
      addressdetails: 1 // Include a breakdown of the address into elements
    };

    var headers = {
      'accept-language': options.languages
    };

    request({
      url    : 'http://nominatim.openstreetmap.org/search',
      qs     : qs,
      json   : true,
      headers: headers
    }, function(err, response, locations) {
      if (err) {
        return callback(err);
      }

      if (response.statusCode === 200) {
        // Parse results
        var results = locations.map(function (location) {
          var address   = location.address;
          var longitude = location.lon;
          var latitude  = location.lat;

          return {
            // TODO: Use GeoJSON format instead of [lng, lat]
            coordinates : [longitude, latitude],
            country     : address.country,
            state       : address.state,
            city        : address.city,
            town        : address.town,
            village     : address.village,
            district    : address.city_district,
            building    : address.building,
            zipcode     : address.postcode,
            streetName  : address.road,
            streetNumber: address.house
          };
        });

        return callback(null, results);
      } else {
        return callback(null, []);
      }
    });
  }

  this.search = search;
  this.isKnown = isKnown;
}

NominatimProvider.prototype = new BaseProvider('nominatim');
module.exports = NominatimProvider;
