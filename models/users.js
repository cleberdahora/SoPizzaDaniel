'use strict';

var crypto   = require('crypto');
var util     = require('util');
var async    = require('async');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// Helper functions

function makeHash(str, salt, callback) {
  var encoding = 'hex';
  if (typeof salt === 'function') {
    callback = salt;
    salt = undefined;
  }

  function getSalt(callback) {
    if (salt) {
      // Use provided salt instead of generating a new one
      return callback(null, salt);
    }

    var saltLength = 32;
    crypto.randomBytes(saltLength, callback);
  }

  function getHash(salt, callback) {
    var iterations = 25000;
    var keyLength  = 512;
    crypto.pbkdf2(str, salt, iterations, keyLength, callback);
  }

  async.waterfall([ getSalt, getHash ], function(err, hashRaw) {
    if (err) {
      return callback(err);
    }

    var hash = hashRaw.toString(encoding);
    callback(null, hash);
  });
}

function validatePassword(password, callback) {
  var currSalt = this.password.salt;
  var currHash = this.password.hash;
  makeHash(password, currSalt, function(err, hash) {
    if (err) {
      return callback(err);
    }

    var isValid = hash.hash === currHash;
    callback(null, isValid);
  });
}


// Schema definition

var roles = ['customer', 'admin'];

var UserSchema = new Schema({
  roles: [{ type: String, enum: roles }],
  name: String,
  email: String,
  password: {
    hash: String,
    salt: String
  },
  phone: String,
  picture: {
    prefix: String,
    suffix: String
  },
});

// Hooks

UserSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  if (this.password && typeof this.password === 'string') {
    makeHash(this.password, function(err, hash) {
      if (err) {
        var msg = util.format('Could not create a password hash: %s', err);
        var error = new Error(msg);
        return next(error);
      }

      this.password = hash;
      next();
    });
  } else {
    // The current password should not be modified if not explicitly replacing
    // it
    delete this.password;
    next();
  }
});

// Methods

UserSchema.methods.validatePassword = validatePassword;

mongoose.model('User', UserSchema);
