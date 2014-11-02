'use strict';

var path     = require('path');
var async    = require('async');
var lodash   = require('lodash');
var geoip    = require('geoip-lite');
var places   = require(path.join(global.root, '/services/places'));
var mongoose = require('mongoose');
var Pizzeria = mongoose.model('Pizzeria');

module.exports = function(router) {
  /**
   * GET /
   * Get a list of pizzerias
   */
  function get(req, res) {
    // [longitude, latitude] as defined in GeoJSON specification
    // http://geojson.org/geojson-spec.html#appendix-a-geometry-examples
    var ll = req.query.ll || [];

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

    // Get places info from database
    function fromDB(callback) {
      Pizzeria.find(function(err, pizzerias) {
        callback(null, pizzerias.map(function(val) {
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
      places.find(ll, callback);
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
   * Find a pizzeria by id
   */
  function getSingle(req, res) {
    var id = req.params.id;

    Pizzeria.findById(id, function(err, pizzeria) {
      if (err) {
        res.status(500).end(); // Internal Server Error
      }

      if (!pizzeria) {
        return res.status(404).end(); // Not Found
      }

      return res.json({
        id         : pizzeria._id,
        name       : pizzeria.name,
        description: pizzeria.description,
        address    : {
          ll: pizzeria.ll
        }
      });
    });
  }

  /**
   * GET /:id/picture
   * Get the main picture of a pizzeria
   */
  function getPicture(req, res) {
    var id = req.params.id;

    Pizzeria.findById(id, function(err, pizzeria) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (!pizzeria) {
        return res.status(404).end(); // Not Found
      }

      res.contentType('image/jpg');
      return res.send(pizzeria.picture);
    });
  }

  /**
   * POST /
   * Create a pizzeria
   */
  function post(req, res) {
    var name = req.body.name;
    var address = req.body.address || {};
    var location = address.location;

    // Verify required fields
    if (!name || !location) {
      return res.status(422).end(); // Unprocessable Entity
    }

    var pizzeria = new Pizzeria({
      name: req.body.name,
      description: req.body.description,
      address: {
      }
    });

    pizzeria.save(function(err) {
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
