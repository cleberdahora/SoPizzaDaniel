'use strict';

var mongoose = require('mongoose');

//var Location = mongoose.model('Location');

function getCachedLocation(query, callback) {
  //Location.findOne({ query: query }, callback);
}

function BaseProvider(providerName) {
  this.providerName      = providerName;
  this.getCachedLocation = getCachedLocation;
}

module.exports = BaseProvider;
