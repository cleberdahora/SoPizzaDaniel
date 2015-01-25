'use strict';

var crypto   = require('crypto');
var util     = require('util');
var async    = require('async');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// Helper functions

function makeHash(str, salt, callback) {
  if (typeof salt === 'function') {
    callback = salt;
    salt = undefined;
  }

  var encoding  = 'hex';

  function getSalt(callback) {
    if (salt) {
      // Use provided salt instead of generating a new one
      return callback(null, new Buffer(salt, encoding));
    }

    var saltLength = 64;
    crypto.randomBytes(saltLength, callback);
  }

  function getHash(saltBuffer, callback) {
    var iter      = 25000;
    var keyLength = 512;
    crypto.pbkdf2(str, saltBuffer, iter, keyLength, function(err, hashBuffer) {
      var hash = hashBuffer.toString(encoding);
      var salt = saltBuffer.toString(encoding);
      callback(err, hash, salt);
    });
  }

  async.waterfall([ getSalt, getHash ], function(err, hash, salt) {
    if (err) {
      return callback(err);
    }

    callback(null, { hash: hash, salt: salt });
  });
}

function validatePassword(password, callback) {
  var currSalt = this.password.salt;
  var currHash = this.password.hash;
  makeHash(password, currSalt, function(err, hashObj) {
    if (err) {
      return callback(err);
    }

    var isValid = hashObj.hash === currHash;
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

function setPassword(password, callback) {
  var self = this;

  makeHash(password, function(err, hashObj) {
    if (err) {
      return callback(err);
    }

    self.password = hashObj;
    callback();
  });
}

UserSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  next();
});

// Methods

UserSchema.methods.setPassword = setPassword;
UserSchema.methods.validatePassword = validatePassword;

// Indexes
UserSchema.path('email')
  .index({ unique: true });

mongoose.model('User', UserSchema);
