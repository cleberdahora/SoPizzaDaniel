(function() {
  'use strict';

  function HomeCtrl($scope, $window, $state, lodash, Restangular, geolocation) {
    let self = this;

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

          $state.go('search', params);
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
        .catch(() => {
          // Use GeoIP as fallback
          return Restangular.all('locations')
            .post();
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

    Restangular.all('locations')
      .post()
      .then(lodash.property('location'))
      .then(lodash.property('coordinates'))
      .then(coordinates => coordinates.reverse()) // from [lng,lat] to [lat,lng]
      .then(coordinates => {
        Restangular.all('places')
          .getList({ coordinates: coordinates.join() })
          .then(places => {
            self.places = places;
          });
      });

    self.search         = search;
    self.getLocation    = getLocation;
    self.getSuggestions = lodash.debounce(getSuggestions, 250, {
      maxWait: 500
    });
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
