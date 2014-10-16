'use strict';

var async   = require('async');
var request = require('request');

function getPhotos(venueId, callback) {
  var url = 'https://api.foursquare.com/v2/venues/' + venueId + '/photos?' +
    'client_id=LKEEQ0LFB0YDKXBXZLWXHDMZK1YZYHPKCGIJ3Q5WI2BEBIAU&' +
    'client_secret=ERGCV1WDFX2DVCP030M5URJK24YQGWOFIM5PEDJRQ4G1SYIN&' +
    'v=20141015&';

  request.get({ uri: url, json: true }, function(err, res, body) {
    callback(null, body.response.photos.items.map(function(photo) {
      return photo.prefix + '320x160' + photo.suffix;
    }));
  });
}

function find(ll, callback) {
  var pizzeriaCategoryId = '4bf58dd8d48988d1ca941735';
  var url = 'https://api.foursquare.com/v2/venues/search' +
    '?ll=' + ll +
    '&client_id=LKEEQ0LFB0YDKXBXZLWXHDMZK1YZYHPKCGIJ3Q5WI2BEBIAU' +
    '&client_secret=ERGCV1WDFX2DVCP030M5URJK24YQGWOFIM5PEDJRQ4G1SYIN' +
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
