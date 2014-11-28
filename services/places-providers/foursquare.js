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

function getCachedPlace(providerInfo, callback) {
  Place.findOne({
    providerInfo: providerInfo,
    expiresOn: { $gt: moment().toDate() }
  }, callback);
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
    callback(null, body.response.photos.items.map(function(photo) {
      return photo.prefix + '320x160' + photo.suffix;
    }));
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
      // TODO: Handle err properly
      callback(null, place);

    } else if (place.id) {
      Place.findById(place.id, mergePlace);

    } else if (place.providerInfo) {
      Place.findOne({
        providerInfo: place.providerInfo
      }, mergePlace);

    } else {
      // TODO: Handle err properly
      place = new Place(place);
      callback(null, place);
    }
  }

  function getVenueInfo(callback) {
    async.parallel({
      workingTimes: lodash.wrap(place.providerInfo.id, getWorkingTime),
      pictures    : lodash.wrap(place.providerInfo.id, getPictures)
    }, callback);
  }

  // Get the most recent informations and update database
  async.parallel({
    place    : getPlace,
    venueInfo: getVenueInfo
  }, function(err, placeInfo) {
    var place = placeInfo.place;
    var venueInfo = placeInfo.venueInfo;

    // TODO: Handle err properly
    place.workingTimes = venueInfo.workingTimes;
    place.picture      = venueInfo.pictures[0];
    place.pictures     = venueInfo.pictures;
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
        phoneNumber: venue.contact.phone,
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

var foursquare = {
  find: find,
  updatePlace: updatePlace
};

module.exports = foursquare;
