'use strict';

var mongoose = require('mongoose');
var Pizzeria = mongoose.model('Pizzeria');

module.exports = function(router) {
  function get(req, res) {
    // TODO: Use real data from db
    res.json([ {name: 'lorem'}, {name: 'ipsum'}, {name: 'dolor'} ]);
  }

  router.get('/', get);
};
