(function() {
  'use strict';

  function HomeCtrl($window, $state, lodash, Restangular, geolocation,
      location) {
    let self = this;

    function getSuggestions(query) {
      query = query.trim();
      if (lodash.isEmpty(query)) {
        self.suggestions = [];
        return;
      }

      location.getSuggestions(query)
        .then(suggestions => {
          self.suggestions = suggestions.map(suggestion => {
            let text        = lodash.first(suggestion.terms).value;
            let description = lodash.rest(suggestion.terms)
              .map(term => term.value)
              .join(', ');

            let value = lodash([text, description])
              .compact()
              .join(', ');

            return {
              value      : value,
              text       : text,
              description: description,
              highlights : suggestion.matches
            };
          });
        })
        .catch(error => {
          self.suggestions = [];
          console.log(error);
        });
    }

    function search(query, coordinates) {
      let params = { q: query };

      if (coordinates) {
        params.ll = coordinates.join();
      }

      $state.go('search', params);
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
            location.state
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
    self.getSuggestions = getSuggestions;
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
