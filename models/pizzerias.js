'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
//let Buffer = mongoose.Types.Buffer;

let pizzeriaSchema = new Schema({
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
  let address = this.address || {};
  let coordinates = address.coordinates || [];
  let lat = coordinates[0];
  let lng = coordinates[1];

  if (typeof lat !== 'undefined' && typeof lng !== 'undefined') {
    return {
      latitude: lat,
      longitude: lng
    };
  }
}

pizzeriaSchema.methods.getCoordinates = getCoordinates;

mongoose.model('Pizzeria', pizzeriaSchema);
