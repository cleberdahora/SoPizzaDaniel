'use strict';

var mongoose = require('mongoose');
var moment   = require('moment');
var Schema   = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

// Helper functions

function createToken(origin) {
  return {
    origin: origin,
    expiresOn: moment().add(30, 'minutes').toDate()
  };
}

function addToken(origin) {
  var token = createToken(origin);
  this.tokens.push(token);

  return token;
}

// Schema definition

var origins = ['mobile', 'web'];

var TokenSchema = new Schema({
  origin: { type: String, enum: origins },
  expiresOn: Date
});

var SessionSchema = new Schema({
  userId: { type: ObjectId, ref: 'User' },
  tokens: [TokenSchema]
});

// Methods

SessionSchema.statics.createToken = createToken;
SessionSchema.methods.addToken = addToken;

mongoose.model('Session', SessionSchema);
