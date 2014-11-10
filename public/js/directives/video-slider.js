(function() {
  'use strict';

  function videoSliderDirective() {
    function link(scope, elem, attrs) {
      let video = elem.find('video');

      if (video[0] && video[0].canPlayType) {
        video.addClass('playing');
        video.on('canplay', function() {
          play();
        });
      }

      function play() {
        video[0].play();
        elem.find(':not(.playing)')
          .hide();
      }
    }

    return {
      restrict: 'AE',
      link: link
    };
  }

  angular.module('app')
    .directive('myVideoSlider', videoSliderDirective);
})();
