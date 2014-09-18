(function() {
  'use strict';

  function routerConfig($locationProvider, $urlRouterProvider, $stateProvider) {
    let states = [];

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/404');

    states.forEach(state => {
      $stateProvider.state(state);
    });
  }

  angular
    .module('app')
    .config(routerConfig);
})();
