(function() {
  'use strict';

  function LocationService($window, $q) {
    let self = this;

    let places  = $window.google.maps.places;
    let service = new places.AutocompleteService();

    function normalizePredictions(predictions) {
      predictions = (predictions || []).map(prediction => {
        return {
          id:      prediction.place_id,
          name:    prediction.description,
          matches: prediction.matched_substrings,
          terms:   prediction.terms,
          types:   prediction.types,
        };
      });

      return predictions;
    }

    function getSuggestions(query) {
      let deferred = $q.defer();

      service.getPlacePredictions({
        input: query,
        types: ['geocode']
      }, (predictions, status) => {
        switch (status) {
          case places.PlacesServiceStatus.OK:
            predictions = normalizePredictions(predictions);
            deferred.resolve(predictions);
            break;

          case places.PlacesServiceStatus.ZERO_RESULTS:
          case places.PlacesServiceStatus.OVER_QUERY_LIMIT:
            deferred.resolve([]);
            break;

          default:
            deferred.reject(status);
        }
      });

      return deferred.promise;
    }

    self.getSuggestions = getSuggestions;
  }

  angular.module('app')
    .service('location', LocationService);
})();
