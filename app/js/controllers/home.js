(function() {
  'use strict';

  function HomeCtrl($scope, Restangular, geolocation) {
    let self = this;
    function getLocation() {
      geolocation.getLocation()
        .then(function(data) {
          if (data.coords) {
            let { longitude, latitude } = data.coords;
            let ll = [longitude, latitude];
            console.log(ll);
          }
        });
    }

    Restangular.all('pizzerias')
      .getList()
      .then(function (pizzerias) {
        self.suggestions = pizzerias;
      });

    self.getLocation = getLocation;
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
