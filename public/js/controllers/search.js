(function() {
  'use strict';

  function SearchCtrl($state, geolocation, lodash, Restangular, $stateParams,
      coordinates) {
    let self = this;
    let [longitude, latitude] = coordinates;

    function search(query, coordinates) {
      let params = { q: query };

      if (coordinates) {
        params.ll = coordinates.join();
      }

      console.log(params);

      $state.go('search', params, { inherit: false });
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
      .getList({ coordinates: coordinates.join() })
      .then(places => {
        self.places = places.map(place => {
          let [longitude, latitude] = place.address.coordinates;

          lodash.merge(place, {
            lat      : latitude,
            lng      : longitude,
            message  : place.name,
            draggable: false
          });

          return place;
        });

        self.loading = false;
      });

    // State
    self.loading     = true;
    self.query       = $stateParams.q;

    // Functions
    self.search      = search;
    self.getLocation = getLocation;

    // Settings
    self.center = {
      lat : latitude,
      lng : longitude,
      zoom: 15
    };
  }

  angular.module('app')
    .controller('SearchCtrl', SearchCtrl);
})();
