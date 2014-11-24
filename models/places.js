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
  updatedAt: Date,
  origin: {
    provider: String,
    id: String
  },
  //picture: { type: Schema.Buffer },

  address: {
    formatted: String,
    // TODO: Convert to GeoJSON format
    coordinates: [Number] // [longitude, latitude]
  },
  workingTimes: [{
    days: [{ type: String, enum: weekdays }],
    times: [{ start: Number, end: Number }]
  }],
});

// Indexes
placeSchema.index({ 'address.coordinates': 1 }, {
  type: '2dsphere'
});

placeSchema.index({ 'origin.provider': 1, 'origin.id': 1 }, {
  unique: true
});

mongoose.model('Place', placeSchema);
