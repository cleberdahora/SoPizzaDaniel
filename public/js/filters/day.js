(function() {
  'use strict';

  function dayFilter(lodash, moment, $window) {
    function isSequence(arr) {
      return true || arr.reduce(function(acc, i, idx) {
        let prevIdx = parseInt(idx) - 1;
        let r = acc && arr[prevIdx] === i;
        return r;
      });
    }

    function dayName(dayNumber) {
      return moment(dayNumber, 'day').locale('pt-BR').format('dddd');
    }

    function formatDays(dayNumbers, untilSeparator, andSeparator) {
      // Special syntax when more than 2 sequential days
      if (dayNumbers.length > 2 && isSequence(dayNumbers)) {
        let firstDay = dayName(lodash.first(dayNumbers));
        let lastDay = dayName(lodash.last(dayNumbers));

        return firstDay + untilSeparator + lastDay;
      }

      let firstDays = lodash.initial(dayNumbers)
        .map(dayName)
        .join(', ');

      let lastDay = dayName(lodash.last(dayNumbers));

      return lodash.compact([firstDays, lastDay]).join(andSeparator);
    }

    function filter(days, untilSeparator = ' até ', andSeparator = ' e ') {
      if (angular.isArray(days) && !days.length) {
        return;
      }

      if (!angular.isArray(days)) {
        days = [days];
      }

      let dayNumbers = days
        .map(day => moment(day, 'dddd', 'en').format('d'))
        .map(dayNumber => parseInt(dayNumber))
        .sort();

      if (dayNumbers.length === 7) {
        return 'Todos os dias';
      }

      return formatDays(dayNumbers, untilSeparator, andSeparator);
    }

    return filter;
  }

  angular.module('app')
    .filter('day', dayFilter);
})();
