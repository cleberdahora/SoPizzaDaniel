'use strict';

var async   = require('async');
var request = require('request');
var key     = 'LKEEQ0LFB0YDKXBXZLWXHDMZK1YZYHPKCGIJ3Q5WI2BEBIAU';
var secret  = 'ERGCV1WDFX2DVCP030M5URJK24YQGWOFIM5PEDJRQ4G1SYIN';
var pizzeriaCategoryId = '4bf58dd8d48988d1ca941735';

/**
 * Denormalizes geographic coordinates from the [longitude, latitude] format
 * as defined in GeoJSON specification to the [latitude, longitude] format
 * accepted by Foursquare API
 * @param {array} ll - Geographic coordinates on [latitude, longitude] format
 * @returns {array} Geographic coordinates on [longitude, latitude] format
 */
function denormalizeCoordinates(ll) {
  var longitude  = ll[0];
  var latitude = ll[1];

  return [latitude, longitude];
}

function getPhotos(venueId, callback) {
  var url = 'https://api.foursquare.com/v2/venues/' + venueId + '/photos' +
    '?client_id=' + key +
    '&client_secret=' + secret +
    '&v=20141015';

  request.get({ uri: url, json: true }, function(err, res, body) {
    callback(null, body.response.photos.items.map(function(photo) {
      return photo.prefix + '320x160' + photo.suffix;
    }));
  });
}

function find(ll, callback) {
  var url = 'https://api.foursquare.com/v2/venues/search' +
    '?ll=' + denormalizeCoordinates(ll) +
    '&client_id=' + key +
    '&client_secret=' + secret +
    '&v=20141015' +
    '&limit=10' +
    '&categoryId=' + pizzeriaCategoryId;

  request.get({ uri: url, json: true }, function(err, res, body) {
    var venues = body.response.venues.map(function (venue) {
      return {
        id: venue.id,
        name: venue.name,
        description: venue.location.address,
        phoneNumber: venue.contact.phone
      };
    });

    // Get photos for each venue
    async.parallel(venues.map(function(venue) {
      return function(callback) {
        getPhotos(venue.id, function(err, photos) {
          venue.photo = photos[0];
          callback(null, venue);
        });
      };
    }), function(err, venues) {
      callback(null, venues);
    });
  });
}

var foursquare = {
  find: find
};

module.exports = foursquare;
