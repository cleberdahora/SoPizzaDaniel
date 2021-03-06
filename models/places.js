'use strict';

var moment   = require('moment');
var lodash   = require('lodash');
var mongoose = require('mongoose');
var GeoJSON  = require('mongoose-geojson-schema');
var Schema   = mongoose.Schema;
var Mixed    = Schema.Types.Mixed;

var weekdays = lodash.range(0, 6).map(function(dayNumber) {
  return moment(dayNumber, 'day')
    .format('dddd')
    .toLowerCase();
});

var DishSchema = new Schema({
  name: String,
  pictureId: String,
  pricing: Mixed,
  ingredients: [String]
});

var PlaceSchema = new Schema({
  providerInfo: {
    provider: String,
    id: String
  },
  name: String,
  description: String,
  coverId: String,
  logoId: String,
  mainPictureId: String,
  pictureIds: [String],
  phone: String,
  email: String,
  address: {
    formatted: String,
    location: GeoJSON.Point
  },
  workingTimes: [{
    days: [{ type: String, enum: weekdays }],
    times: [{ start: Number, end: Number }]
  }],
  dishes: [DishSchema],
  expiresOn: Date
});

// Indexes
PlaceSchema.index({ 'address.location': '2dsphere' });

PlaceSchema.index({ 'providerInfo.provider': 1, 'providerInfo.id': 1 }, {
  unique: true,
  sparse: true
});

// Misc
PlaceSchema.set('toJSON', { getters: true });

mongoose.model('Place', PlaceSchema);
