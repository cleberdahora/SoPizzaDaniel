'use strict';

var mongoose = require('mongoose');
var async    = require('async');

var User = mongoose.model('User');
var Session = mongoose.model('Session');

module.exports = function(router) {
  /**
   * POST /
   * Create a new session
   */
  function post(req, res) {
    var email    = req.body.email;
    var password = req.body.password;
    var origin   = req.body.origin;

    // Verify required fields
    if (!email || !password || !origin) {
      return res.status(422).end(); // Unprocessable Entity
    }

    // Get user by e-mail
    function getUser(callback) {
      User.findOne({ email: email.toLowerCase() }, function(err, user) {
        return callback(err, user);
      });
    }

    // Verify if the password is correct
    function checkPassword(user, callback) {
      if (!user) {
        return callback(401); // Unauthenticated
      }

      user.validatePassword(password, function(err, isValid) {
        if (err) {
          return callback(err);
        }

        if (!isValid) {
          return callback(401); // Unauthenticated
        }

        return callback(null, user);
      });
    }

    // Create a new session
    function createSession(user, callback) {
      var session = new Session({
        userId: user.id
      });

      var token = session.addToken(origin);

      // Create the new session and give back a token to the user
      session.save(function(err, session) {
        if (err) {
          return callback(err);
        }

        return callback(null, session, token);
      });
    }

    async.waterfall([
        getUser,       // Get user by e-mail
        checkPassword, // Verify if the password is correct
        createSession  // Create a new session
    ], function(err, session, token) {
      if (err && typeof err === 'number') {
        return res.status(err).end();
      }

      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      return res
        .status(201) // Created
        .json({
          id: session.id,
          token: token
        });
    });
  }

  function del(req, res) {
    // TODO: Implement session deletion
    return;
  }

  // TODO: Implement the commented routes below
  //router.get('/', get);
  //router.get('/:id', getSingle);
  router.post('/', post);
  router.delete('/:session', del);
};
