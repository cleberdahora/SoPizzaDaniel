'use strict';

var path       = require('path');
var lodash     = require('lodash');
var geoip      = require('geoip-lite');
var async      = require('async');
var mongoose   = require('mongoose');
var cloudinary = require('cloudinary');
var places     = require(path.resolve('./services/places'));

var Place = mongoose.model('Place');

module.exports = function(router) {
  /**
   * GET /
   * Get a list of places
   */
  function get(req, res) {
    if (!req.query.coordinates) {
      // TODO: Verify if user is authenticated
      return Place
        .find({ providerInfo: null })
        .exec(function(err, places) {
          if (err) {
            return res.status(500).end(); // Internal Server Error
          }

          return res.json(places);
        });
    }

    // TODO: Validate coordinates format with RegExp
    // Coordinates in latitude,longitude format
    var coordinates = (req.query.coordinates || '').split(',');

    if (lodash.isEmpty(lodash.compact(coordinates))) {
      var location  = geoip.lookup(req.ip);

      if (location) {
        coordinates = location.ll;
      } else {
        // If no location information was found, defaults to São Paulo, Brazil
        coordinates = [-23.5505199, -46.6333094];
      }
    }

    // Get places info from all sources
    places.find({
      location: toGeoJSON(coordinates)
    }, function(err, results) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      results = lodash.flatten(results);
      results = lodash.sortBy(results, function(place) {
        if (lodash.isEmpty(place.providerInfo)) {
          // Places without provider (provided by us) have priority
          return 1;
        }
        return 2;
      });

      return res.json(results);
    });
  }

  /**
   * GET /:id
   * Find a place by id
   */
  function getSingle(req, res) {
    var id = req.params.id;

    places.findOne(id, function(err, place) {
      if (err) {
        res.status(500).end(); // Internal Server Error
      }

      if (!place) {
        return res.status(404).end(); // Not Found
      }

      return res.json(place);
    });
  }

  /**
   * GET /:id/picture
   * Get the main picture of a place
   */
  function getPicture(req, res) {
    var id = req.params.id;

    Place.findById(id, function(err, place) {
      if (err) {
        return res.status(500).end(); // Internal Server Error
      }

      if (!place) {
        return res.status(404).end(); // Not Found
      }

      res.contentType('image/jpg');
      return res.send(place.picture);
    });
  }

  /**
   * PUT /:id
   * Update a place
   */
  function put(req, res) {
    var id       = req.params.id;
    var name     = req.body.name;
    var address  = req.body.address || {};
    var location = address.location;
    var logo     = req.body.logo;
    var cover    = req.body.cover;
    var pictures = req.body.pictures;
    var dishes   = req.body.dishes;

    // Verify required fields
    if (!name || !location) {
      return res.status(422).end(); // Unprocessable Entity
    }

    function saveImage(image) {
      return function(callback) {
        if (!image) {
         return callback(null, null); // No ID to give back
        }

        cloudinary.uploader.upload(image, function(result) {
          callback(null, result.public_id);
        });
      };
    }

    function saveImages(images) {
      return function(callback) {
        async.parallel(lodash.map(images, saveImage), callback);
      };
    }

    function saveDishImages(dishes) {
      return function(callback) {
        async.parallel(lodash.map(dishes, function(dish) {
          return function(callback) {
            saveImage(dish.picture)(function(err, imageId) {
              dish.pictureId = imageId || dish.pictureId;
              callback(null, dish);
            });
          };
        }), callback);
      };
    }

    async.parallel({
      coverId:    saveImage(cover),
      logoId:     saveImage(logo),
      pictureIds: saveImages(pictures),
      dishes:     saveDishImages(dishes)
    }, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).end(); // Internal Server Error
      }

      // TODO: Take only necessary fields from body
      var place = lodash.omit(req.body, '_id');

      place.dishes     = data.dishes;
      place.coverId    = data.coverId || place.coverId || null;
      place.logoId     = data.logoId  || place.logoId  || null;
      place.pictureIds = lodash(place.pictureIds).concat(data.pictureIds);

      Place
        .findById(id)
        .findOneAndUpdate(place, function(err) {
          if (err) {
            console.error(err);
            return res.status(500).end(); // Internal Server Error
          }

          return res.status(201).end(); // Created
        });
    });
  }

  /**
   * POST /
   * Create a place
   */
  function post(req, res) {
    var name     = req.body.name;
    var address  = req.body.address || {};
    var location = address.location;
    var logo     = req.body.logo;
    var cover    = req.body.cover;
    var pictures = req.body.pictures;
    var dishes   = req.body.dishes;

    // Verify required fields
    if (!name || !location) {
      return res.status(422).end(); // Unprocessable Entity
    }

    function saveImage(image) {
      return function(callback) {
        if (!image) {
         return callback(null, null); // No ID to give back
        }

        cloudinary.uploader.upload(image, function(result) {
          callback(null, result.public_id);
        });
      };
    }

    function saveImages(images) {
      return function(callback) {
        async.parallel(lodash.map(images, saveImage), callback);
      };
    }

    function saveDishImages(dishes) {
      return function(callback) {
        async.parallel(lodash.map(dishes, function(dish) {
          return function(callback) {
            saveImage(dish.picture)(function(err, imageId) {
              dish.pictureId = imageId;
              callback(null, dish);
            });
          };
        }), callback);
      };
    }

    async.parallel({
      coverId:    saveImage(cover),
      logoId:     saveImage(logo),
      pictureIds: saveImages(pictures),
      dishes:     saveDishImages(dishes)
    }, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).end(); // Internal Server Error
      }

      var place = new Place(req.body);

      place.dishes     = data.dishes;
      place.coverId    = data.coverId;
      place.logoId     = data.logoId;
      place.pictureIds = data.pictureIds;

      place.save(function(err) {
        if (err) {
          console.error(err);
          return res.status(500).end(); // Internal Server Error
        }

        return res.status(201).end(); // Created
      });
    });
  }

  /**
   * POST /
   * Remove a place
   */
  function remove(req, res) {
    var id = req.params.id;

    Place.findByIdAndRemove(id, function(err, place) {
      if (err) {
        console.error(err);
        return res.status(500).end(); // Internal Server Error
      }

      if (!place) {
        return res.status(404).end(); // Not Found
      }

      res.status(204).end(); // No Content

      // Post-processing (remove images)
      var pictureIds = place.pictureIds;
      var logoId     = place.logoId;
      var coverId    = place.coverId;
      var imageIds   = lodash(new Array(pictureIds, logoId, coverId))
        .flatten()
        .compact()
        .value();

      async.parallel(imageIds.map(function(imageId) {
        return lodash.partial(cloudinary.uploader.destroy, imageId);
      }), function(err, results) {
        if (err) {
          console.error(err);
        }
      });
    });
  }

  function toGeoJSON(coordinates) {
    var latitude  = coordinates[0];
    var longitude = coordinates[1];

    return {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
  }

  router.get('/', get);
  router.get('/:id', getSingle);
  router.get('/:id/picture', getPicture);
  router.put('/:id', put);
  router.post('/', post);
  router.delete('/:id', remove);
};
