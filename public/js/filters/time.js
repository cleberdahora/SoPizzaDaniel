(function() {
  'use strict';

  function timeFilter(lodash, moment, $window) {
    function padTime(time) {
      if (String(time).length >= 4) {
        return String(time);
      }

      return padTime('0' + time);
    }

    function formatTime(timeNumber) {
      let timeStr = padTime(timeNumber);

      return moment.utc(timeStr, 'HHmm')
        .format('HH:mm');
    }

    function formatTimes(times, rangeSeparator, timeSeparator) {
      if (!angular.isArray(times)) {
        times = [times];
      }

      return times.map(time => {
        if (angular.isObject(time)) {
          let {start, end} = time;

          if (start === end) {
            return 'O dia inteiro';
          }

          return formatTime(start) + rangeSeparator + formatTime(end);

        } else {
          return formatTime(time);
        }
      }).join(timeSeparator);
    }

    function filter(time, rangeSeparator = '~', timeSeparator = ', ') {
      if (angular.isArray(time) && !time.length) {
        return;
      }
      console.log(time);

      return formatTimes(time, rangeSeparator, timeSeparator);
    }

    return filter;
  }

  angular.module('app')
    .filter('time', timeFilter);
})();
