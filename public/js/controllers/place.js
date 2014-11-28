(function() {
  'use strict';

  function PlaceCtrl($state, lodash, Restangular, place, geolocation) {
    let self = this;

    place.dishes = [
      {
        picture: 'https://irs2.4sqi.net/img/general/320x160/' +
          'fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg',
        name: 'Parmegiana',
        price: 100.00,
        ingredients: [
          'calabresa',
          'parmesão',
          'cebola',
          'alho',
        ]
      },
      {
        picture: 'https://irs2.4sqi.net/img/general/320x160/' +
          'fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg',
        name: 'Parmegiana2',
        price: 35.00,
        ingredients: [
          'calabresa',
          'parmesão',
          'cebola',
          'alho',
        ]
      }
    ];

    self.place = place;
  }

  angular.module('app')
    .controller('PlaceCtrl', PlaceCtrl);
})();
