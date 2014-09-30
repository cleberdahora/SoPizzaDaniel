(function() {
  'use strict';

  function HomeCtrl($scope, Restangular) {
    Restangular.all('pizzerias')
      .getList()
      .then(function (pizzerias) {
        $scope.pizzerias = pizzerias;
      });
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
