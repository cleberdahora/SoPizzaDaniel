(function() {
  'use strict';

  function googleMapConfig(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      v: '3.18',
      libraries: 'weather,geometry,visualization'
    });
  }

  angular.module('app')
    .config(googleMapConfig);

})();
