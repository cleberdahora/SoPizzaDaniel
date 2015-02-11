(function() {
  'use strict';

  function AdminCtrl($scope, $window, Auth, Restangular, lodash, moment) {
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

    function savePlace(place) {
      // TODO: Choose between createPlace and updatePlace based on application
      // state
      createPlace(place);
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
        dish.ingredients = dish.ingredients || '';
        dish.ingredients = dish.ingredients
          .split(',')
          .map(ingredient => ingredient.trim());
        dish.ingredients = lodash.compact(dish.ingredients);
        return dish;
      });
    }

    function createPlace(place) {
      // Avoid type transformation problems on same properties
      place = lodash.cloneDeep(place);

      let { latitude, longitude } = place.address || {};

      place.logo             = place.logoPicture;
      place.cover            = place.coverPicture;
      place.address.location = toGeoJSON([latitude, longitude]);
      place.pictures         = lodash.compact(place.pictures);
      place.dishes           = formatDishes(place.dishes);
      place.workingTimes     = formatWorkingTimes(place.workingTimes);

      Restangular.all('places')
        .post(place)
        .then(res => console.log(res))
        .catch(err => console.log(err));
    }

    function toGeoJSON(coordinates) {
      var [latitude, longitude]  = coordinates;

      return {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }

    function updatePlace() {

    }

    self.currentPlace      = { address: {}, pictures: [] };
    self.savePlace         = savePlace;
    self.createPlace       = createPlace;
    self.updatePlace       = updatePlace;
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
