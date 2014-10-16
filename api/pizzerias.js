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
    var ll = [req.query.latitude, req.query.longitude];

    if (lodash.isEmpty(lodash.compact(ll))) {
      var location = geoip.lookup(req.ip);

      ll = (({} || location).ll) || [-23.5505199,-46.6333094];
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

      // Extract coordinates from array [lat, lng]
      // TODO: Use ES6 destructuring when available on node

      return res.json({
        id         : pizzeria._id,
        name       : pizzeria.name,
        description: pizzeria.description,
        address    : {
          coordinates: pizzeria.getCoordinates()
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

      //res.set('Content-Type', 'image/jpg');
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
