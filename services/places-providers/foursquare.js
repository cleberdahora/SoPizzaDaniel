'use strict';

var async    = require('async');
var moment   = require('moment');
var lodash   = require('lodash');
var request  = require('request');
var mongoose = require('mongoose');

var Place = mongoose.model('Place');

var key     = 'LKEEQ0LFB0YDKXBXZLWXHDMZK1YZYHPKCGIJ3Q5WI2BEBIAU';
var secret  = 'ERGCV1WDFX2DVCP030M5URJK24YQGWOFIM5PEDJRQ4G1SYIN';
var baseURL = 'https://api.foursquare.com/v2/venues/';

var pizzeriaCategoryId = '4bf58dd8d48988d1ca941735';

/**
 * Denormalizes geographic coordinates from the [longitude, latitude] format
 * as defined in GeoJSON specification to the [latitude, longitude] format
 * accepted by Foursquare API
 * @param {array} coordinates - Geographic coordinates on [lat, lng] format
 * @returns {array} Geographic coordinates on [lng, lat] format
 */
function denormalizeCoordinates(coordinates) {
  var longitude = coordinates[0];
  var latitude  = coordinates[1];

  return [latitude, longitude];
}

function parseTimeframes(timeframes) {
  return (timeframes || []).map(function(timeframe) {
    var days = timeframe.days
      .map(function(dayNumber) {
        return moment(dayNumber - 1, 'day') // Parse the arcane number as a day
          .format('dddd')                   // Get day name
          .toLowerCase();
      });


    // Convert from 01:00 of next day from '+0100' to 100
    var workingTimes = timeframe.open
      .map(function(workingTime) {
        var start = parseInt(workingTime.start.replace('+', ''));
        var end   = parseInt(workingTime.end.replace('+', ''));

        return {
          start: start,
          end  : end
        };
      });

    return {
      days: days,
      times: workingTimes
    };
  });
}

function getWorkingTime(venueId, callback) {
  var url = baseURL + venueId + '/hours';

  var qs = {
    v            : moment().format('YYYYmmDD'),
    client_id    : key,
    client_secret: secret
  };

  request.get({
    uri : url,
    qs  : qs,
    json: true
  }, function(err, res, body) {
    var response = body.response;
    var common   = response.hours;
    var popular  = response.popular;
    var timeframes = parseTimeframes(common.timeframes || popular.timeframes);

    callback(null, timeframes);
  });
}

function getPhotos(venueId, callback) {
  var url = baseURL + venueId + '/photos';

  var qs = {
    v            : moment().format('YYYYmmDD'),
    client_id    : key,
    client_secret: secret
  };

  request.get({
    uri : url,
    qs  : qs,
    json: true
  }, function(err, res, body) {
    callback(null, body.response.photos.items.map(function(photo) {
      return photo.prefix + '320x160' + photo.suffix;
    }));
  });
}

function find(coordinates, callback) {
  var url = baseURL + 'search';

  var qs = {
    v            : moment().format('YYYYmmDD'),
    client_id    : key,
    client_secret: secret,
    categoryId   : pizzeriaCategoryId,
    ll           : denormalizeCoordinates(coordinates).join(),
    limit        : 10
  };

  request.get({
    uri : url,
    qs  : qs,
    json: true
  }, function(err, res, body) {
    var venues = body.response.venues.map(function (venue) {
      return {
        origin: 'foursquare',
        providerId: venue.id,
        name: venue.name,
        description: venue.location.address,
        phoneNumber: venue.contact.phone,
        address: {
          formatted: venue.location.address,
          coordinates: [venue.location.lng, venue.location.lat]
        }
      };
    });

    // Get photos for each venue
    async.parallel(venues.map(function(venue) {
      return function(callback) {
        async.parallel({
          workingTimes: lodash.wrap(venue.providerId, getWorkingTime),
          photos      : lodash.wrap(venue.providerId, getPhotos)
        }, function(err, venueInfo) {
          // TODO: Handle err properly
          venue.workingTimes = venueInfo.workingTimes;
          venue.photo        = venueInfo.photos[0];
          venue.photos       = venueInfo.photos;

          callback(null, venue);
        });
      };
    }), function(err, venues) {
      // Sync local db as a cache storage
      async.parallel(venues.map(function(venue) {
        return function(callback) {
          var place = new Place(venue);

          place.expiresOn = moment()
            .add(30, 'days')
            .toDate();

          Place.findOne({
            providerId: venue.providerId
          }, function(err, dbPlace) {
            if (dbPlace) {
              callback(null, dbPlace);
            } else {
              place.save(function(err, place) {
                callback(err, place);
              });
            }
          });
        };
      }), callback);
    });
  });
}

var foursquare = {
  find: find
};

module.exports = foursquare;
