(function() {
  'use strict';

  function SearchCtrl($scope, Restangular) {
    let self = this;

    self.defaults = {
      scrollWheelZoom: false
    };

    self.osloCenter = {
      lat: -23.6051241,
      lng: -46.475982699999996,
      zoom: 16
    };

    Restangular.all('pizzerias')
      .getList()
      .then(function (pizzerias) {
        let places = pizzerias.map(pizzeria => {
          let [lng, lat] = pizzeria.address.coordinates;

          return {
            lat: lat,
            lng: lng,
            message: pizzeria.name,
            focus: true,
            draggable: false
          };
        });

        self.places = places;
      });
  }

  angular.module('app')
    .controller('SearchCtrl', SearchCtrl);
})();
