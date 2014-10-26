'use strict';

var geoip = require('geoip-lite');

module.exports = function(router) {

  function post(req, res) {
    var ip       = req.ip;
    var location = geoip.lookup(ip);

    // Verify if location was found
    if (location) {
      return res
        .status(201) // Created
        .json({
          country: location.country,
          region : location.region,
          city   : location.city,
          ll     : location.ll,
        });
    } else {
      return res.status(201).end(); // Created 
    }

  }

  router.post('/', post);
};
