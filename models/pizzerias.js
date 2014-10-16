'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var Buffer = mongoose.Types.Buffer;

var pizzeriaSchema = new Schema({
  name: String,
  description: String,
  //picture: { type: Schema.Buffer },

  address: {
    coordinates: [Number] // [latitude, longitude]
  }
});

pizzeriaSchema.index({
  'address.coordinates': '2d'
});

/**
 * Custom methods
 */

/**
 * Get the coordinates of the pizzeria
 * @return {Object} An object containing latitude and longitude informations.
 */
function getCoordinates() {
  var address = this.address || {};
  var coordinates = address.coordinates || [];
  var lat = coordinates[0];
  var lng = coordinates[1];

  if (typeof lat !== 'undefined' && typeof lng !== 'undefined') {
    return {
      latitude: lat,
      longitude: lng
    };
  }
}

pizzeriaSchema.methods.getCoordinates = getCoordinates;

mongoose.model('Pizzeria', pizzeriaSchema);
