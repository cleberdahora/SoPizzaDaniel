'use strict';

var lodash    = require('lodash');
var geoip     = require('geoip-lite');
var request   = require('request');

module.exports = function(router) {

  /**
   * GET /?:query
   * Search locations based on a query and receives back informations of
   * matching locations
   */
  function get(req, res) {
    var query     = req.query.query;
    var languages = req.acceptsLanguages();

    var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    var qs  = {
      input: query,
      types: 'geocode',
      language: lodash.first(languages),
      key: 'AIzaSyCZBZp2lxGVzFhkghHKOaSpUyBqWQeTpEQ',
    };

    request({
      url: url,
      qs: qs,
      json: true
    }, function(err, response, json) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        return res.status(500).end(); // Internal Server Error
      }

      var suggestions = json.predictions.map(function(prediction) {
        return {
          id: prediction.place_id,
          name: prediction.description,
          terms: prediction.terms,
          matches: prediction.matched_substrings,
        };
      });

      return res.json(suggestions);
    });
  }

  /**
   * GET /:id
   * Get detailed information about a location
   **/
  function getSingle(req, res) {
    var id        = req.params.id;
    var languages = req.acceptsLanguages();

    var url = 'https://maps.googleapis.com/maps/api/place/details/json';
    var qs  = {
      key: 'AIzaSyCZBZp2lxGVzFhkghHKOaSpUyBqWQeTpEQ',
      placeid: id,
      types: 'geocode',
      language: lodash.first(languages)
    };

    request({
      url: url,
      qs: qs,
      json: true
    }, function(err, response, json) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (json.status === 'ZERO_RESULTS') {
        return res.status(404).end(); // Not Found
      }

      if (json.status !== 'OK') {
        return res.status(500).end(); // Internal Server Error
      }

      var info = json.result;
      var location = info.geometry.location;

      var locationInfo = {
          id: info.place_id,
          location: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          }
        };

      return res.json(locationInfo);
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
  router.get('/:id', getSingle);
  router.post('/', post);
};
