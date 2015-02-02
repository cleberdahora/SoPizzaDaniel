(function() {
  'use strict';

  function AdminCtrl($scope, $window, Auth, Restangular, lodash, moment) {
    let self = this;

    let weekdays = lodash(lodash.range(0, 6))
      .map(dayNumber => {
        //let languages = $window.navigator.languages;
        let languages = ['pt-br'];

        let day = moment(dayNumber, 'day')
          .format('dddd')
          .toLowerCase();

        let localeDay = moment(dayNumber, 'day')
          .locale(languages)
          .format('dddd')
          .toLowerCase();
        return [day, localeDay];
      })
      .zipObject()
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

    self.currentPlace      = {};
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
