(function() {
  'use strict';

  function SearchCtrl($state, geolocation, lodash, Restangular, $stateParams,
      coordinates) {
    let self = this;
    let [longitude, latitude] = coordinates;

    function search(query, coordinates) {
      let params = { query };

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
      .then(function (pizzerias) {
        self.pizzerias = pizzerias.map(pizzeria => {
          let [longitude, latitude] = pizzeria.address.coordinates;

          lodash.merge(pizzeria, {
            lat      : latitude,
            lng      : longitude,
            message  : pizzeria.name,
            draggable: false
          });

          return pizzeria;
        });
      });

    self.search = search;
    self.getLocation = getLocation;
    self.query = $stateParams.query;
    self.center = {
      lat : latitude,
      lng : longitude,
      zoom: 15
    };
    self.aoeu = function() {
      console.log(arguments);
    };
  }

  angular.module('app')
    .controller('SearchCtrl', SearchCtrl);
})();
