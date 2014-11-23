(function() {
  'use strict';

  function HomeCtrl($state, lodash, Restangular, geolocation) {
    let self = this;

    function search(query, coordinates) {
      var params = { q: query };

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
          let coordinates = [longitude, latitude];

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

    Restangular.all('pizzerias')
      .getList()
      .then(places => {
        self.places = places;
      });

    self.search      = search;
    self.getLocation = getLocation;
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
