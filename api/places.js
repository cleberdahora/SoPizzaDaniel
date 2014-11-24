'use strict';

var path     = require('path');
var async    = require('async');
var lodash   = require('lodash');
var geoip    = require('geoip-lite');
var places   = require(path.join(global.root, '/services/places'));
var mongoose = require('mongoose');
var Place    = mongoose.model('Place');

module.exports = function(router) {
  /**
   * GET /
   * Get a list of places
   */
  function get(req, res) {
    // [longitude, latitude] as defined in GeoJSON specification
    // http://geojson.org/geojson-spec.html#appendix-a-geometry-examples
    var coordinates = (req.query.coordinates || '').split(',');

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

    // Get places info from database
    function fromDB(callback) {
      Place.find(function(err, places) {
        callback(null, places.map(function(val) {
          return {
            id           : val._id,
            name         : val.name,
            description  : val.description,
            externalLinks: val.externalLinks,
            address      : val.address
          };
        }));
      });
    }

    // Get places info from providers
    function fromProviders(callback) {
      places.find(coordinates, callback);
    }

    // Get places info from database and providers asynchronously
    async.parallel([fromDB, fromProviders], function(err, results) {
      if (err) {
        return res.status(500).end();
      }

      return res.json(lodash.flatten(results));
    });
  }

  /**
   * GET /:id
   * Find a place by id
   */
  function getSingle(req, res) {
    var id = req.params.id;

    Place.findById(id, function(err, place) {
      if (err) {
        res.status(500).end(); // Internal Server Error
      }

      if (!place) {
        return res.status(404).end(); // Not Found
      }

      return res.json({
        id         : place._id,
        name       : place.name,
        description: place.description,
        address    : {
          ll: place.ll
        }
      });
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
    var name = req.body.name;
    var address = req.body.address || {};
    var location = address.location;

    // Verify required fields
    if (!name || !location) {
      return res.status(422).end(); // Unprocessable Entity
    }

    var place = new Place({
      name: req.body.name,
      description: req.body.description,
      address: {
      }
    });

    place.save(function(err) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      return res.status(201).end(); // Created
    });
  }

  router.get('/', get);
  router.get('/:id', getSingle);
  router.get('/:id/picture', getPicture);
  router.post('/', post);
};
