'use strict';

var lodash   = require('lodash');
var geoip   = require('geoip-lite');
var request = require('request');

module.exports = function(router) {

  /**
   * GET /?:query
   * Search locations based on a query and receives back detailed information
   * of matching locations
   */
  function get(req, res) {
    var query = req.query.query;

    request({
      url    : 'http://nominatim.openstreetmap.org/search',
      qs     : {
        q             : query,
        format        : 'json',
        addressdetails: 1 // Include a breakdown of the address into elements
      },
      json   : true,
      headers: {
        'accept-language': req.acceptsLanguages()
      }
    }, function(err, response, locations) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (response.statusCode === 200) {
        // Parse results
        var results = locations.map(function (location) {
          var address   = location.address;
          var longitude = location.lon;
          var latitude  = location.lat;

          return {
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

        return res.json(results);
      } else {
        return res.status(201).end(); // Created
      }
    });
  }

  /**
   * POST /
   * Add information about current geographic position and receives back
   * detailed information if available
   */
  function post(req, res) {
    // [longitude, latitude] as defined in GeoJSON specification
    // http://geojson.org/geojson-spec.html#appendix-a-geometry-examples
    var coordinates = req.body.coordinates || [];

    if (lodash.isEmpty(lodash.compact(coordinates))) {

      var location  = geoip.lookup(req.ip);

      if (location) {
        // node-geoip returns information on [latitude, longitude] format
        var latitude  = location.ll[0];
        var longitude = location.ll[1];

        coordinates = [longitude, latitude];
      } else {
        // If no location information was found, defaults to São Paulo, Brazil
        coordinates = [-46.6333094, -23.5505199];
      }
    }

    var url = 'http://nominatim.openstreetmap.org/reverse';
    var query = {
      format        : 'json',
      lat           : coordinates[1],
      lon           : coordinates[0],
      zoom          : 18, // Level of detail (0 = country, 18 = house/building)
      addressdetails: 1   // Include a breakdown of the address into elements
    };

    // Verify if location was found
    request({
      url    : url,
      qs     : query,
      json   : true,
      headers: {
        'accept-language': req.acceptsLanguages()
      }
    }, function(err, response, location) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (response.statusCode === 200) {
        var address = location.address;
        return res
          .status(201) // Created
          .json({
            country      : address.country,
            state        : address.state,
            city         : address.city,
            town         : address.town,
            village      : address.village,
            district     : address.city_district,
            building     : address.building,
            zipcode      : address.postcode,
            streetName   : address.road,
            streetNumber : address.house
          });
      } else {
        return res.status(201).end(); // Created
      }
    });
  }

  router.get('/', get);
  router.post('/', post);
};
