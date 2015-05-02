'use strict';

var async      = require('async');
var util       = require('util');
var moment     = require('moment');
var lodash     = require('lodash');
var request    = require('request');
var mongoose   = require('mongoose');
var cloudinary = require('cloudinary');

var Place        = mongoose.model('Place');
var BaseProvider = require('./base.js');

var key     = 'J345Y5QR1TB42E1C1YMZJ3QQGOC2ZSYMROW1J5WUAEZZ0TWF';
var secret  = 'L2EPZONRXGONIEFKS4TULUFST55BSBNZ2SW1DEXX2HRRGO1P';
var baseURL = 'https://api.foursquare.com/v2/venues/';

var pizzeriaCategoryId = '4bf58dd8d48988d1ca941735';

/**
 * Denormalizes geographic coordinates from the GeoJSON format to the
 * [latitude, longitude] format accepted by Foursquare API
 * @param {array} location - Geographic coordinates on GeoJSON format of
 * Point type
 * @returns {array} Geographic coordinates on [lat, lng] format
 */
function denormalizeLocation(location) {
  var coordinates = location.coordinates;
  var longitude   = coordinates[0];
  var latitude    = coordinates[1];

  return [parseFloat(latitude), parseFloat(longitude)];
}

function getCachedPlace(providerInfo, callback) {
  Place.findOne({
    providerInfo: providerInfo,
    expiresOn: { $gt: moment().toDate() }
  }, callback);
}

function saveImage(image, size, callback) {
  if (typeof size === 'function') {
    callback = size;
    size     = 'cap300';
  }

  var url = util.format('%s%s%s', image.prefix, size, image.suffix);
  cloudinary.uploader.upload(url, function(result) {
    callback(null, result.public_id);
  });
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
      if (err) {
        console.error(err);
      }
      var response = body.response    || {};
      var common   = response.hours   || {};
      var popular  = response.popular || {};
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
      if (err) {
        console.error(err);
        return callback(err);
      }

      var pictures = lodash.take(body.response.photos.items, 4);

      // Save all pictures and return their IDs
      async.parallel(pictures.map(function(picture) {
        return function(callback) {
          saveImage(picture, callback);
        };
      }), function(err, results) {
        callback(err, results);
      });
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
      if (err) {
        console.error(err);
      }
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
      pictureIds  : lodash.wrap(place.providerInfo.id, getPictures)
    }, function(err, placeInfo) {
      var place        = placeInfo.place;
      var venueInfo    = placeInfo.venueInfo;
      var workingTimes = placeInfo.workingTimes;
      var pictureIds   = placeInfo.pictureIds;

      // TODO: Handle err properly
      place.workingTimes  = workingTimes;
      place.description   = venueInfo.description;
      place.mainPictureId = pictureIds[0];
      place.pictureIds    = pictureIds;
      place.expiresOn     = moment()
        .add(30, 'days')
        .toDate();

      if (venueInfo.page && venueInfo.page.user && venueInfo.page.user.photo) {
        // Save logo before saving place
        var logo = venueInfo.page.user.photo;
        saveImage(logo, '96x96', function(err, logoId) {
          place.logoId = logoId;
          place.save(function(err, place) {
            // TODO: Handle err properly
            callback(null, place);
          });
        });
      } else {
        place.save(function(err, place) {
          // TODO: Handle err properly
          callback(null, place);
        });
      }
    });
  }

  function find(location, callback) {
    var url = baseURL + 'search';

    var qs = {
      v            : moment().format('YYYYmmDD'),
      client_id    : key,
      client_secret: secret,
      categoryId   : pizzeriaCategoryId,
      ll           : denormalizeLocation(location).join(),
      limit        : 20
    };

    request.get({
      uri : url,
      qs  : qs,
      json: true
    }, function(err, res, body) {
      if (err) {
        console.error(err);
      }
      var places = body.response.venues.map(function (venue) {
        return {
          providerInfo: {
            provider: 'foursquare',
            id: venue.id
          },
          name: venue.name,
          description: venue.location.address,
          phone: venue.contact.phone,
          address: {
            formatted: venue.location.address,
            location: {
              type: 'Point',
              coordinates: [venue.location.lng, venue.location.lat]
            }
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
