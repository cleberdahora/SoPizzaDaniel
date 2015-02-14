(function() {
  'use strict';

  function AdminCtrl($scope, $window, Auth, Restangular, lodash, moment,
      $state) {
    let self = this;

    let weekdays = lodash(lodash.range(0, 7))
      .map(dayNumber => {
        let languages = $window.navigator.languages;

        let day = moment(dayNumber, 'day')
          .format('dddd')
          .toLowerCase();

        let localeDay = moment(dayNumber, 'day')
          .locale(languages)
          .format('dddd')
          .toLowerCase();

        return {
          name: day,
          localeName: localeDay
        };
      })
      .value();

    function getPlaces() {
        // TODO: Handle errors here
        Restangular.all('places')
          .getList()
          .then(places => self.places = places);
    }

    function authenticate(email, password) {
      self.authenticating = true;
      Auth.signIn(email, password)
        .then(() => {
          self.authenticating = false;
          getPlaces();
        })
        .catch(err => {
          if (err === Auth.UNPROCESSABLE_ENTITY) {
            alert('Preencha os campos corretamente.');
          }

          if (err === Auth.UNAUTHORIZED) {
            alert('Usuário/senha inválido(s)!');
          }
        });
    }

    function generateThumb(files, property, object=self) {
      let fileReader = new FileReader();
      let [file] = files;

      fileReader.readAsDataURL(file);
      fileReader.onload = function(e) {
        object[property] = e.target.result;
        $scope.$apply();
      };
    }

    if (Auth.isSignedIn) {
      getPlaces();
    }

    function addWorkingTime() {
      let currentPlace = self.currentPlace;
      if (!currentPlace.workingTimes) {
        currentPlace.workingTimes = [];
      }

      currentPlace.workingTimes.push({
        //fromDay: Date(),
        //toDay: Date(),
        //fromTime: Date(),
        //toTime: Date()
      });
    }

    function removeWorkingTime(workingTime) {
      let currentPlace = self.currentPlace;
      lodash.pull(currentPlace.workingTimes, workingTime);
    }

    function addDish() {
      let currentPlace = self.currentPlace;
      if (!currentPlace.dishes) {
        currentPlace.dishes = [];
      }

      currentPlace.dishes.push({});
    }

    function toGeoJSON(coordinates) {
      let [latitude, longitude]  = coordinates;

      return {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    function fromGeoJSON(geojson) {
      let {coordinates} = geojson;
      let [longitude, latitude]  = coordinates;

      return [latitude, longitude];
    }

    function formatWorkingTimes(workingTimes) {
      return lodash.map(workingTimes, workingTime => {
        return {
          // TODO: Use a multiselect to choose as many days as necessary
          days: [workingTime.fromDay, workingTime.toDay],
          times: [{
            start: moment(workingTime.fromTime).format('HHmm'),
            end: moment(workingTime.toTime).format('HHmm')
          }]
        };
      });
    }

    function formatDishes(dishes) {
      return lodash.map(dishes, dish => {
        if (lodash.isArray(dish.ingredients)) {
          dish.ingredients = dish.ingredients.join();
        } else {
          dish.ingredients = dish.ingredients || '';
        }

        dish.ingredients = dish.ingredients
          .split(',')
          .map(ingredient => ingredient.trim());
        dish.ingredients = lodash.compact(dish.ingredients);
        dish.pricing = parseFloat(dish.pricing);
        return dish;
      });
    }

    function savePlace(place) {
      place = Restangular.copy(place);

      let { latitude, longitude } = place.address || {};

      place.address.location = toGeoJSON([latitude, longitude]);
      place.pictures         = lodash.compact(place.pictures);
      place.dishes           = formatDishes(place.dishes);
      place.workingTimes     = formatWorkingTimes(place.workingTimes);

      if (place.id) {
        place.put()
          .then(() => $state.reload())
          .catch(err => console.log(err));
      } else {
        Restangular.all('places')
          .post(place)
          .then(() => $state.reload())
          .catch(err => console.log(err));
      }
    }

    function editPlace(place) {
      let currentPlace = lodash.cloneDeep(place);
      let [latitude, longitude] = fromGeoJSON(place.address.location);

      currentPlace.address.latitude = latitude;
      currentPlace.address.longitude = longitude;
      currentPlace.pictures = [];

      self.currentPlace = currentPlace;
      self.showPlaceForm = true;
    }

    function cleanCurrentPlace() {
      self.currentPlace = { address: {}, pictures: [] };
    }

    self.currentPlace      = { address: {}, pictures: [] };
    self.cleanCurrentPlace = cleanCurrentPlace;
    self.editPlace         = editPlace;
    self.savePlace         = savePlace;
    self.weekdays          = weekdays;
    self.addWorkingTime    = addWorkingTime;
    self.addDish           = addDish;
    self.removeWorkingTime = removeWorkingTime;
    self.generateThumb     = generateThumb;
    self.isSignedIn        = Auth.isSignedIn;
    self.authenticate      = authenticate;
    self.authenticating    = false;
  }

  angular.module('app')
    .controller('AdminCtrl', AdminCtrl);
})();
