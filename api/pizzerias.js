'use strict';

module.exports = function(router) {
  function get(req, res) {
    // TODO: Use real data from db
    res.json([ {name: 'lorem'}, {name: 'ipsum'}, {name: 'dolor'} ]);
  }

  router.get('/', get);
};
