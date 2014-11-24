'use strict';

var moment   = require('moment');
var lodash   = require('lodash');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var weekdays = lodash.range(0, 6).map(function(dayNumber) {
  return moment(dayNumber, 'day')
    .format('dddd')
    .toLowerCase();
});

var placeSchema = new Schema({
  name: String,
  description: String,
  origin: String,
  providerId: String,
  //picture: { type: Schema.Buffer },

  address: {
    formatted: String,
    coordinates: [Number] // [longitude, latitude]
  },
  workingTimes: [{
    days: [{ type: String, enum: weekdays }],
    times: [{ start: Number, end: Number }]
  }],
  expiresOn: Date
});

// Indexes
placeSchema
  .path('address.coordinates')
  .index({ type: '2dsphere' });

placeSchema
  .path('expiresOn')
  .index({ 'expireAfterSeconds': 0 });

mongoose.model('Place', placeSchema);
