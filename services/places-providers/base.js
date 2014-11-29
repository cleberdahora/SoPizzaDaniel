'use strict';

var moment   = require('moment');
var mongoose = require('mongoose');

var Place = mongoose.model('Place');

function getCachedPlace(providerInfo, callback) {
  Place.findOne({
    providerInfo: providerInfo,
    expiresOn: { $gt: moment().toDate() }
  }, callback);
}

function BaseProvider(providerName) {
  this.providerName = providerName;
  this.getCachedPlace = getCachedPlace;
}

module.exports = BaseProvider;
