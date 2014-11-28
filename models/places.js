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
  providerInfo: {
    provider: String,
    id: String
  },
  name: String,
  description: String,
  picture: String,
  pictures: [String],
  phone: String,

  address: {
    formatted: String,
    // TODO: Convert to GeoJSON format
    coordinates: [Number] // [longitude, latitude]
  },
  workingTimes: [{
    days: [{ type: String, enum: weekdays }],
    times: [{ start: Number, end: Number }]
  }],
  expiresOn: Date
});

// Indexes
placeSchema.index({ 'address.coordinates': 1 }, {
  type: '2dsphere'
});

placeSchema.index({ 'providerInfo.provider': 1, 'providerInfo.id': 1 }, {
  unique: true
});

mongoose.model('Place', placeSchema);
