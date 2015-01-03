(function() {
  'use strict';

  function HomeCtrl($scope, $window, $state, lodash, Restangular, geolocation) {
    let self = this;

    function search(query, coordinates) {
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
          let params = {
            q: query,
            ll: place.location.coordinates.join()
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
          let coordinates             = [longitude, latitude];

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
      .getList()
      .then(places => {
        self.places = places;
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
