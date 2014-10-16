'use strict';

let path     = require('path');
let async    = require('async');
let lodash   = require('lodash');
let places   = require(path.join(global.root, '/services/places'));
let mongoose = require('mongoose');
let Pizzeria = mongoose.model('Pizzeria');

module.exports = function(router) {
  /**
   * GET /
   * Get a list of pizzerias
   */
  function get(req, res) {
    let location = {
      latitude : req.query.latitude,
      longitude: req.query.longitude
    };

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
      places.find(location, callback);
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
    let id = req.params.id;

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
    let id = req.params.id;

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
    let name = req.body.name;
    let address = req.body.address || {};
    let location = address.location;

    // Verify required fields
    if (!name || !location) {
      return res.status(422).end(); // Unprocessable Entity
    }

    let pizzeria = new Pizzeria({
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
