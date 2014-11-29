'use strict';

var async    = require('async');
var moment   = require('moment');
var lodash   = require('lodash');
var request  = require('request');
var mongoose = require('mongoose');

var Place        = mongoose.model('Place');
var BaseProvider = require('./base.js');

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

function getCachedPlace(providerInfo, callback) {
  Place.findOne({
    providerInfo: providerInfo,
    expiresOn: { $gt: moment().toDate() }
  }, callback);
}

function FoursquareProvider() {
  function parseTimeframes(timeframes) {
    return (timeframes || []).map(function(timeframe) {
      var days = timeframe.days
        .map(function(dayNumber) {
          return moment(dayNumber - 1, 'day') // Parse the arcane number as day
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
      // TODO: Handle err properly
      var response = body.response;
      var common   = response.hours;
      var popular  = response.popular;
      var timeframes = parseTimeframes(common.timeframes || popular.timeframes);

      callback(null, timeframes);
    });
  }

  function getPictures(venueId, callback) {
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
      // TODO: Handle err properly
      callback(null, body.response.photos.items.map(function(photo) {
        return photo.prefix + '320x160' + photo.suffix;
      }));
    });
  }

  function getVenueInfo(venueId, callback) {
    var url = baseURL + venueId;

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
      // TODO: Handle err properly
      callback(null, body.response.venue);
    });
  }

  function updatePlace(place, callback) {
    function getPlace(callback) {
      // Merge place information with database place information
      function mergePlace(err, dbPlace) {
        // TODO: Handle err properly
        if (!dbPlace) {
          dbPlace = new Place(place);
        }

        place = lodash.merge(dbPlace, place);
        callback(null, place);
      }

      if (place instanceof Place) {
        // Already a db place
        callback(null, place);

      } else if (place.id) {
        // Merge the place by id
        Place.findById(place.id, mergePlace);

      } else if (place.providerInfo) {
        // Merge the place by provider information
        Place.findOne({
          providerInfo: place.providerInfo
        }, mergePlace);

      } else {
        // Create a new place
        place = new Place(place);
        callback(null, place);
      }
    }

    // Get the most recent informations and update database
    async.parallel({
      place       : getPlace,
      venueInfo   : lodash.wrap(place.providerInfo.id, getVenueInfo),
      workingTimes: lodash.wrap(place.providerInfo.id, getWorkingTime),
      pictures    : lodash.wrap(place.providerInfo.id, getPictures)
    }, function(err, placeInfo) {
      var place        = placeInfo.place;
      var venueInfo    = placeInfo.venueInfo;
      var workingTimes = placeInfo.workingTimes;
      var pictures     = placeInfo.pictures;

      // TODO: Handle err properly
      place.workingTimes = workingTimes;
      place.description  = venueInfo.description;
      place.picture      = pictures[0];
      place.pictures     = pictures;
      place.expiresOn    = moment()
        .add(30, 'days')
        .toDate();


      place.save(function(err, place) {
        // TODO: Handle err properly
        callback(null, place);
      });
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
      limit        : 50
    };

    request.get({
      uri : url,
      qs  : qs,
      json: true
    }, function(err, res, body) {
      var places = body.response.venues.map(function (venue) {
        return {
          providerInfo: {
            provider:'foursquare',
            id: venue.id
          },
          name: venue.name,
          description: venue.location.address,
          phone: venue.contact.phone,
          address: {
            formatted: venue.location.address,
            coordinates: [venue.location.lng, venue.location.lat]
          }
        };
      });

      // Get additional information (e.g. pictures, working time) for each venue
      async.parallel(places.map(function(place) {
        return function(callback) {
          // Try to use cached information to avoid unnecessary requests
          getCachedPlace(place.providerInfo, function(err, cachedPlace) {
            if (cachedPlace) {
              // Return cached information
              callback(null, cachedPlace);
            } else {
              // Get the most recent informations and update database
              updatePlace(place, callback);
            }
          });
        };
      }), callback);
    });
  }

  this.find        = find;
  this.updatePlace = updatePlace;
}

FoursquareProvider.prototype = new BaseProvider('foursquare');

module.exports = FoursquareProvider;
