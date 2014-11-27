(function() {
  'use strict';

  function PlaceCtrl($state, lodash, Restangular, place, geolocation) {
    let self = this;

    self.place = place;
  }

  angular.module('app')
    .controller('PlaceCtrl', PlaceCtrl);
})();
