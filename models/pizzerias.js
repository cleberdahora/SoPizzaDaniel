'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Buffer = mongoose.Types.Buffer;

var pizzeriaSchema = new Schema({
  name: String,
  description: String,
  picture: Buffer,
  address: {
    coordinates: [Number] // [latitude, longitude]
  }
});

pizzeriaSchema.index({
  'address.coordinates': '2d'
});

mongoose.model('Pizzeria', pizzeriaSchema);
