'use strict';

var mongoose = require('mongoose');

var User = mongoose.model('User');

module.exports = function(router) {
  /**
   * POST /
   * Create a user
   */
  function post(req, res) {
    var name     = req.body.name;
    var email    = req.body.email;
    var password = req.body.password;

    // Verify required fields
    if (!name || !email || !password) {
      return res.status(422).end(); // Unprocessable Entity
    }

    var user = new User({
      name: name,
      email: email
    });

    user.setPassword(password, function(err) {
      if (err) {
        console.log(err);
        return res.status(500).end(); // Internal Server Error
      }

      user.save(function(err) {
        const DUPLICATE_KEY = 11000;
        if (err && err.code === DUPLICATE_KEY) {
          return res.status(409).end(); // Internal Server Error
        }

        if (err) {
          return res.status(500).end(); // Internal Server Error
        }

        return res.status(201).end(); // Created
      });
    });
  }

  // TODO: Implement the commented routes below
  //router.get('/', get);
  //router.get('/:id', getSingle);
  //router.get('/:id/picture', getPicture);
  router.post('/', post);
};
