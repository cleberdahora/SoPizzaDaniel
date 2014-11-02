(function() {
  'use strict';

  function HomeCtrl($state, lodash, Restangular, geolocation) {
    let self = this;

    function search(query) {
      $state.go('search', { query: query });
    }

    function getLocation() {
      geolocation.getLocation()
        .then(function(data) {
          let { longitude, latitude } = data.coords;
          let ll = [longitude, latitude];

          return Restangular.all('locations')
            .post({ ll: ll });
        })
        .then(function(location) {
          self.query = lodash.compact([
            location.streetName,
            location.steetNumber,
            location.state
          ]).join(', ');
        });
    }

    Restangular.all('pizzerias')
      .getList()
      .then(function (pizzerias) {
        self.suggestions = pizzerias;
      });

    self.search      = search;
    self.getLocation = getLocation;
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
