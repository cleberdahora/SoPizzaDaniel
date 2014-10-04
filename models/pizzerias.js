'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pizzeriaSchema = new Schema({
  name: String,
  description: String,
  address: {

  }
});

mongoose.model('Pizzeria', pizzeriaSchema);
