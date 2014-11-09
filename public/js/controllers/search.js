(function() {
  'use strict';

  function SearchCtrl($scope, Restangular, $stateParams, coordinates) {
    let self = this;
    let [longitude, latitude] = coordinates;

    self.center = {
      lat : latitude,
      lng : longitude,
      zoom: 16
    };

    Restangular.all('pizzerias')
      .getList({ coordinates: coordinates.join() })
      .then(function (pizzerias) {
        self.pizzerias = pizzerias.map(pizzeria => {
          let [longitude, latitude] = pizzeria.address.coordinates;

          return {
            lat      : latitude,
            lng      : longitude,
            message  : pizzeria.name,
            draggable: false
          };
        });
      });
  }

  angular.module('app')
    .controller('SearchCtrl', SearchCtrl);
})();
