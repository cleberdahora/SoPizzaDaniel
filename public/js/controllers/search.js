(function() {
  'use strict';

  function SearchCtrl($scope, $state, $stateParams, Restangular, lodash,
      geolocation, coordinates) {
    let self = this;
    let [latitude, longitude] = coordinates;

    //function gambiHTML(place) {
    //  //let {prefix, suffix} = place.logo;

    //  return '' +
    //    //'<img class="picture" src="' + prefix + '100x100' + suffix + '">' +
    //    '<div class="info">' +
    //      '<div class="title">' +
    //        '<a class="title-link" href="/place/' + place.id + '">' +
    //          place.name +
    //        '</a>' +
    //      '</div>' +
    //      '<div class="address">' +
    //        place.address.formatted +
    //      '</div>' +
    //      '<a class="go-link" href="/place/' + place.id + '">ver >></a>' +
    //    '</div>';
    //}

    function search(query) {
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
      .getList({ coordinates: coordinates.join() })
      .then(places => {
        // FIXME: It looks like that coords parameter on markers directive
        // (angular-google-maps) doesn't accept 2 or more levels of property
        // nesting. Replicating location property on root objects by now.
        self.places = places.map(place => {
          lodash.merge(place, {
            location: place.address.location
          });

          return place;
        });

        self.loading = false;
      });

    // State
    self.loading = true;
    self.query   = $stateParams.q;
    self.searchLocation = { latitude, longitude };

    // Functions
    self.search         = search;
    self.getLocation    = getLocation;
    self.getSuggestions = lodash.debounce(getSuggestions, 250, {
      maxWait: 500
    });

    // Settings
    self.center = { latitude, longitude };
  }

  angular.module('app')
    .controller('SearchCtrl', SearchCtrl);
})();
