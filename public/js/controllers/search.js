(function() {
  'use strict';

  function SearchCtrl($scope, $state, $stateParams, Restangular, lodash,
      geolocation, coordinates, uiGmapGoogleMapApi) {
    let self = this;
    let [latitude, longitude] = coordinates;

    function search(query) {
      if (angular.isObject(query)) {
        query = query.value;
      }

      Restangular.all('locations')
        .getList({ query })
        .then(suggestions => {
          if (lodash.isEmpty(suggestions)) {
            // TODO: Handle this, please
            console.log('empty');
          } else {
            let suggestion = lodash.first(suggestions);
            return Restangular.all('locations')
              .get(suggestion.id);
          }
        })
        .then(place => {
          let [longitude, latitude] = place.location.coordinates;
          let params = {
            q: query,
            ll: [latitude, longitude].join()
          };

          $state.go('search', params, { inherit: false });
        });
    }

    function getSuggestions(query) {
      query = query.trim();

      if (lodash.isEmpty(query)) {
        self.suggestions = [];
        return $scope.$apply();
      }

      Restangular.all('locations')
        .getList({ query })
        .then(suggestions => {
          // Double-check to avoid delayed suggestions after erased query
          if (!self.query && !self.query.trim()) {
            return;
          }

          self.suggestions = suggestions.map(suggestion => {
            let text        = lodash.first(suggestion.terms).value;
            let description = lodash.rest(suggestion.terms)
              .map(term => term.value)
              .join(', ');

            return {
              id         : suggestion.id,
              value      : suggestion.name,
              text       : text,
              description: description,
              highlights : suggestion.matches
            };
          });
        })
        .catch(error => {
          self.suggestions = [];
          console.error(error);
        });
    }

    // Get user location using HTML5 Geolocation feature
    function getLocation() {
      geolocation.getLocation()
        .then(data => {
          let { longitude, latitude } = data.coords;
          let coordinates             = [latitude, longitude];

          self.coordinates = coordinates;

          return Restangular.all('locations')
            .post({ coordinates });
        })
        .then(location => {
          self.query = lodash.compact([
            location.streetName,
            location.steetNumber,
            location.state || location.city
          ]).join(', ');

          search(self.query, self.coordinates);
        });
    }

    Restangular.all('places')
      .getList({ coordinates: coordinates.join() })
      .then(places => {
        // FIXME: It looks like that coords parameter on markers directive
        // (angular-google-maps) doesn't accept 2 or more levels of property
        // nesting. Replicating location property on root objects by now.
        self.places = places.map(place => {
          function showPopup() {
            self.selectedPlace = place;
          }

          lodash.merge(place, {
            location: place.address.location,
            onClick : showPopup
          });

          return place;
        });

        self.loading = false;
      });

    // Initialization
    self.places = [];

    // State
    self.loading = true;
    self.query   = $stateParams.q;

    // Functions
    self.search         = search;
    self.getLocation    = getLocation;
    self.getSuggestions = lodash.debounce(getSuggestions, 250, {
      maxWait: 500
    });

    // Settings
    self.center = { latitude, longitude };

    uiGmapGoogleMapApi.then(maps => {
      self.location = {
        latitude,
        longitude,
        icon: {
          animation: maps.Animation.BOUNCE,
          size: new maps.Size(48, 48)
        }
      };
    });
  }

  angular.module('app')
    .controller('SearchCtrl', SearchCtrl);
})();
