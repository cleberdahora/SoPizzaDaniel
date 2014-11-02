'use strict';

var lodash   = require('lodash');
var geoip   = require('geoip-lite');
var request = require('request');

module.exports = function(router) {

  /**
   * POST /
   * Add information about current geographic position and receives back
   * detailed information if available
   */
  function post(req, res) {
    // [longitude, latitude] as defined in GeoJSON specification
    // http://geojson.org/geojson-spec.html#appendix-a-geometry-examples
    var ll = req.body.ll || [];
    console.log(ll);

    if (lodash.isEmpty(lodash.compact(ll))) {

      var location  = geoip.lookup(req.ip);

      if (location) {
        // node-geoip returns information on [latitude, longitude] format
        var latitude  = location.ll[0];
        var longitude = location.ll[1];

        ll = [longitude, latitude];
      } else {
        // If no location information was found, defaults to São Paulo, Brazil
        ll = [-46.6333094, -23.5505199];
      }
    }

    var url = 'http://nominatim.openstreetmap.org/reverse';
    var query = {
      format        : 'json',
      lat           : ll[1],
      lon           : ll[0],
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
        console.log(location);
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

  router.post('/', post);
};
