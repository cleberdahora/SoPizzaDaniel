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
  providerId: String,
  //picture: { type: Schema.Buffer },

  address: {
    formatted: String,
    coordinates: [Number] // [longitude, latitude]
  },
  workingTimes: [{
    days: [{ type: String, enum: weekdays }],
    times: [{ start: Number, end: Number }]
  }]
});

// TODO: Change to 2D spherical index
placeSchema.index({
  'address.coordinates': '2dsphere'
});

mongoose.model('Place', placeSchema);
