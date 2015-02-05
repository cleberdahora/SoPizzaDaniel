'use strict';

var path     = require('path');
var lodash   = require('lodash');
var geoip    = require('geoip-lite');
var mongoose = require('mongoose');
var places   = require(path.resolve('./services/places'));

var Place = mongoose.model('Place');

module.exports = function(router) {
  /**
   * GET /
   * Get a list of places
   */
  function get(req, res) {
    if (!req.query.coordinates) {
      // TODO: Verify if user is authenticated
      return Place
        .find({ providerInfo: { $ne: null }})
        .exec(function(err, places) {
          if (err) {
            return res.status(500).end(); // Internal Server Error
          }

          return res.json(places);
        });
    }

    // TODO: Validate coordinates format with RegExp
    // Coordinates in latitude,longitude format
    var coordinates = (req.query.coordinates || '').split(',');

    if (lodash.isEmpty(lodash.compact(coordinates))) {
      var location  = geoip.lookup(req.ip);

      if (location) {
        coordinates = location.ll;
      } else {
        // If no location information was found, defaults to São Paulo, Brazil
        coordinates = [-23.5505199, -46.6333094];
      }
    }

    // Get places info from all sources
    places.find({
      location: toGeoJSON(coordinates)
    }, function(err, results) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      results = lodash.flatten(results);

      return res.json(results);
    });
  }

  /**
   * GET /:id
   * Find a place by id
   */
  function getSingle(req, res) {
    var id = req.params.id;

    places.findOne(id, function(err, place) {
      if (err) {
        res.status(500).end(); // Internal Server Error
      }

      if (!place) {
        return res.status(404).end(); // Not Found
      }

      return res.json(place);
    });
  }

  /**
   * GET /:id/picture
   * Get the main picture of a place
   */
  function getPicture(req, res) {
    var id = req.params.id;

    Place.findById(id, function(err, place) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (!place) {
        return res.status(404).end(); // Not Found
      }

      res.contentType('image/jpg');
      return res.send(place.picture);
    });
  }

  /**
   * POST /
   * Create a place
   */
  function post(req, res) {
    var name     = req.body.name;
    var address  = req.body.address || {};
    var location = address.location;

    // Verify required fields
    if (!name || !location) {
      return res.status(422).end(); // Unprocessable Entity
    }

    var place = new Place(req.body);

    place.save(function(err) {
      if (err) {
        console.log(err);
        return res.status(500).end(); // Internal Server Error
      }

      return res.status(201).end(); // Created
    });
  }

  function toGeoJSON(coordinates) {
    var latitude  = coordinates[0];
    var longitude = coordinates[1];

    return {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
  }

  router.get('/', get);
  router.get('/:id', getSingle);
  router.get('/:id/picture', getPicture);
  router.post('/', post);
};
