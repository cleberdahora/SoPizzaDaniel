'use strict';

let mongoose = require('mongoose');
let Pizzeria = mongoose.model('Pizzeria');

module.exports = function(router) {
  /**
   * GET /
   * Get a list of pizzerias
   */
  function get(req, res) {
    Pizzeria.find(function(err, pizzerias) {
      res.json(pizzerias.map(function(val) {
        return {
          id         : val._id,
          name       : val.name,
          description: val.description
        };
      }));
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

      return res.json({
        id         : pizzeria._id,
        name       : pizzeria.name,
        description: pizzeria.description
      });
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
  router.post('/', post);
};
