'use strict';

let async   = require('async');
let request = require('request');

function getPhotos(venueId, callback) {
  let url = 'https://api.foursquare.com/v2/venues/' + venueId + '/photos?' +
    'client_id=LKEEQ0LFB0YDKXBXZLWXHDMZK1YZYHPKCGIJ3Q5WI2BEBIAU&' +
    'client_secret=ERGCV1WDFX2DVCP030M5URJK24YQGWOFIM5PEDJRQ4G1SYIN&' +
    'v=20141015&';

  request.get({ uri: url, json: true }, function(err, res, body) {
    callback(null, body.response.photos.items.map(function(photo) {
      return photo.prefix + '320x160' + photo.suffix;
    }));
  });
}

function find(location, callback) {
  let pizzeriaCategoryId = '4bf58dd8d48988d1ca941735';
  let url = 'https://api.foursquare.com/v2/venues/search?' +
    'll=-23.5505199,-46.6333094&' +
    'client_id=LKEEQ0LFB0YDKXBXZLWXHDMZK1YZYHPKCGIJ3Q5WI2BEBIAU&' +
    'client_secret=ERGCV1WDFX2DVCP030M5URJK24YQGWOFIM5PEDJRQ4G1SYIN&' +
    'v=20141015&limit=10&categoryId=' + pizzeriaCategoryId;

  request.get({ uri: url, json: true }, function(err, res, body) {
    let venues = body.response.venues.map(function (venue) {
      return {
        id: venue.id,
        name: venue.name,
        description: venue.location.address
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

let foursquare = {
  find: find
};

module.exports = foursquare;
